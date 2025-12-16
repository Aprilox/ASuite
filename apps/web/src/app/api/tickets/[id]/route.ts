import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { getSession } from '@/lib/auth';

// GET /api/tickets/[id] - Détail d'un ticket
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();

    if (!user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        userId: user.id, // S'assurer que c'est bien son ticket
      },
      include: {
        messages: {
          where: { isInternal: false }, // Ne pas montrer les notes internes
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
                userRoles: {
                  include: {
                    role: {
                      select: {
                        name: true,
                        displayName: true,
                        color: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Erreur GET /api/tickets/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/tickets/[id] - Ajouter un message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();

    if (!user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { message } = body;

    // Importer les helpers
    const { sanitizeText, validateTextLength } = await import('@/lib/sanitize');

    // Récupérer la longueur max depuis les paramètres
    const messageLengthSetting = await prisma.systemSetting.findUnique({
      where: { key: 'support.messageMaxLength' }
    });
    const messageMaxLength = parseInt(messageLengthSetting?.value || '10000');

    if (!message || message.trim().length < 2) {
      return NextResponse.json({ error: 'Message trop court' }, { status: 400 });
    }

    // Validation longueur maximale
    const messageError = validateTextLength(message, messageMaxLength, 'Message');
    if (messageError) {
      return NextResponse.json({ error: messageError }, { status: 400 });
    }

    // Sanitization HTML
    const sanitizedMessage = sanitizeText(message);

    // Vérifier que le ticket appartient à l'utilisateur
    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket non trouvé' }, { status: 404 });
    }

    // Vérifier que le ticket n'est pas fermé
    if (ticket.status === 'closed') {
      return NextResponse.json({ error: 'Ce ticket est fermé' }, { status: 400 });
    }

    // Créer le message (utiliser le message sanitized)
    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        authorId: user.id,
        content: sanitizedMessage,
        isInternal: false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Mettre à jour explicitement le ticket pour que updatedAt change et qu'il remonte en haut
    await prisma.ticket.update({
      where: { id },
      data: {
        updatedAt: new Date(), // Force la mise à jour pour que le ticket remonte en haut de la liste
      },
    });

    // Mettre à jour le statut si nécessaire (passe en "open" si était "resolved" ou "pending")
    if (['resolved', 'pending'].includes(ticket.status)) {
      await prisma.ticket.update({
        where: { id },
        data: { status: 'open' },
      });
    }

    // Importer les helpers de notification
    const { notifyUser, notifyAdminsWithPermission, NotificationTypes, getUsersWithPermission } = await import('@/lib/notification-helpers');
    const { hasPermission } = await import('@/lib/admin-auth');
    const notificationManager = (await import('@/lib/notification-manager')).default;

    // Vérifier si l'auteur du message est un admin
    const isAdmin = await hasPermission('tickets.respond');

    if (isAdmin) {
      // Admin a répondu → notifier le client propriétaire du ticket
      const notification = await notifyUser(
        ticket.userId,
        NotificationTypes.TICKET_RESPONSE_ADMIN,
        ticket.id,
        ticket.number
      );

      // Envoyer en temps réel au client avec le vrai ID
      notificationManager.sendToUser(ticket.userId, {
        id: notification?.id, // Vrai ID de la base de données
        type: 'ticket_response_admin',
        ticketId: ticket.id,
        ticketNumber: ticket.number,
        title: `Réponse sur le ticket #${ticket.number}`,
        message: 'Un administrateur a répondu à votre ticket',
        createdAt: new Date().toISOString(),
      });
    } else {
      // Client a répondu → notifier tous les admins avec tickets.respond
      const createdNotifications = await notifyAdminsWithPermission(
        'tickets.respond',
        NotificationTypes.TICKET_RESPONSE_CLIENT,
        ticket.id,
        ticket.number,
        ticket.subject
      );

      // Envoyer en temps réel aux admins avec les vrais IDs
      const adminIds = await getUsersWithPermission('tickets.respond');
      for (const adminId of adminIds) {
        const notification = createdNotifications.find((n: any) => n.userId === adminId);

        notificationManager.sendToUser(adminId, {
          id: notification?.id, // Vrai ID de la base de données
          type: 'ticket_response_client',
          ticketId: ticket.id,
          ticketNumber: ticket.number,
          title: `Réponse client sur le ticket #${ticket.number}`,
          message: 'Le client a répondu au ticket',
          createdAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ message: newMessage });
  } catch (error) {
    console.error('Erreur POST /api/tickets/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

