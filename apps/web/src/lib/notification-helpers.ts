import { prisma } from '@asuite/database';

/**
 * Types de notifications
 */
export const NotificationTypes = {
  TICKET_NEW: 'ticket_new',
  TICKET_RESPONSE_ADMIN: 'ticket_response_admin',
  TICKET_RESPONSE_CLIENT: 'ticket_response_client',
} as const;

export type NotificationType = typeof NotificationTypes[keyof typeof NotificationTypes];

/**
 * Templates de notifications (multilingue)
 */
const notificationTemplates: Record<NotificationType, { fr: { title: string; message: string }; en: { title: string; message: string } }> = {
  [NotificationTypes.TICKET_NEW]: {
    fr: {
      title: 'Nouveau ticket #{{number}}',
      message: '{{subject}}',
    },
    en: {
      title: 'New ticket #{{number}}',
      message: '{{subject}}',
    },
  },
  [NotificationTypes.TICKET_RESPONSE_ADMIN]: {
    fr: {
      title: 'Réponse sur le ticket #{{number}}',
      message: 'Un administrateur a répondu à votre ticket',
    },
    en: {
      title: 'Response on ticket #{{number}}',
      message: 'An administrator has responded to your ticket',
    },
  },
  [NotificationTypes.TICKET_RESPONSE_CLIENT]: {
    fr: {
      title: 'Réponse client sur le ticket #{{number}}',
      message: 'Le client a répondu au ticket',
    },
    en: {
      title: 'Client response on ticket #{{number}}',
      message: 'The client has responded to the ticket',
    },
  },
};

/**
 * Crée une notification pour un utilisateur
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  ticketId: string,
  ticketNumber: number,
  ticketSubject?: string
) {
  try {
    // Récupérer la locale de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { locale: true },
    });

    const locale = (user?.locale === 'en' ? 'en' : 'fr') as 'fr' | 'en';
    const template = notificationTemplates[type][locale];

    // Interpoler les variables
    const title = template.title
      .replace('{{number}}', ticketNumber.toString())
      .replace('{{subject}}', ticketSubject || '');

    const message = template.message
      .replace('{{number}}', ticketNumber.toString())
      .replace('{{subject}}', ticketSubject || '');

    // Créer la notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        ticketId,
        ticketNumber,
        read: false,
      },
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Récupère tous les utilisateurs ayant une permission spécifique
 */
export async function getUsersWithPermission(permission: string): Promise<string[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        isBlocked: false,
        userRoles: {
          some: {
            role: {
              permissions: {
                some: {
                  permission: {
                    code: permission,
                  },
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    return users.map(u => u.id);
  } catch (error) {
    console.error('Error getting users with permission:', error);
    return [];
  }
}

/**
 * Notifie tous les administrateurs ayant une permission spécifique
 */
export async function notifyAdminsWithPermission(
  permission: string,
  type: NotificationType,
  ticketId: string,
  ticketNumber: number,
  ticketSubject?: string
) {
  try {
    const adminIds = await getUsersWithPermission(permission);

    // Créer une notification pour chaque admin et retourner les résultats
    const notifications = await Promise.all(
      adminIds.map(adminId =>
        createNotification(adminId, type, ticketId, ticketNumber, ticketSubject)
      )
    );

    // Filtrer les null (erreurs)
    return notifications.filter((n): n is NonNullable<typeof n> => n !== null);
  } catch (error) {
    console.error('Error notifying admins:', error);
    return [];
  }
}

/**
 * Notifie un utilisateur spécifique
 */
export async function notifyUser(
  userId: string,
  type: NotificationType,
  ticketId: string,
  ticketNumber: number,
  ticketSubject?: string
) {
  return await createNotification(userId, type, ticketId, ticketNumber, ticketSubject);
}

/**
 * Marque une notification comme lue
 */
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return false;
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Marque toutes les notifications d'un utilisateur comme lues
 */
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return result.count;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return 0;
  }
}

/**
 * Récupère les notifications d'un utilisateur
 */
export async function getUserNotifications(userId: string, limit = 30) {
  try {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
}

/**
 * Compte les notifications non lues d'un utilisateur
 */
export async function countUnreadNotifications(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    return 0;
  }
}
