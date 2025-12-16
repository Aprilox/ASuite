import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { getSession } from '@/lib/auth';

// GET /api/tickets - Mes tickets
export async function GET() {
  try {
    const user = await getSession();

    if (!user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const tickets = await prisma.ticket.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Erreur GET /api/tickets:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/tickets - Créer un ticket
export async function POST(request: Request) {
  try {
    const user = await getSession();

    if (!user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, category, priority, message } = body;

    // Importer les helpers
    const { sanitizeText, validateTextLength } = await import('@/lib/sanitize');

    // Récupérer les paramètres support
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['support.creationEnabled', 'support.subjectMaxLength', 'support.messageMaxLength', 'support.ticketRateLimit']
        }
      }
    });

    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
    const creationEnabled = settingsMap['support.creationEnabled'] === 'true';
    const subjectMaxLength = parseInt(settingsMap['support.subjectMaxLength'] || '200');
    const messageMaxLength = parseInt(settingsMap['support.messageMaxLength'] || '10000');
    const rateLimit = parseInt(settingsMap['support.ticketRateLimit'] || '3');

    // Vérifier si création tickets activée
    if (!creationEnabled) {
      return NextResponse.json({ error: 'La création de tickets est temporairement désactivée' }, { status: 503 });
    }

    // Rate limiting - vérifier nombre de tickets créés dans la dernière heure
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTicketsCount = await prisma.ticket.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: oneHourAgo
        }
      }
    });

    if (recentTicketsCount >= rateLimit) {
      return NextResponse.json({
        error: `Vous avez atteint la limite de ${rateLimit} tickets par heure. Veuillez réessayer plus tard.`
      }, { status: 429 });
    }

    // Validation minimale
    if (!subject || subject.trim().length < 5) {
      return NextResponse.json({ error: 'Sujet trop court (min. 5 caractères)' }, { status: 400 });
    }

    if (!message || message.trim().length < 10) {
      return NextResponse.json({ error: 'Message trop court (min. 10 caractères)' }, { status: 400 });
    }

    // Validation longueur maximale
    const subjectError = validateTextLength(subject, subjectMaxLength, 'Sujet');
    if (subjectError) {
      return NextResponse.json({ error: subjectError }, { status: 400 });
    }

    const messageError = validateTextLength(message, messageMaxLength, 'Message');
    if (messageError) {
      return NextResponse.json({ error: messageError }, { status: 400 });
    }

    // Sanitization HTML
    const sanitizedSubject = sanitizeText(subject);
    const sanitizedMessage = sanitizeText(message);

    const validCategories = ['bug', 'question', 'feature', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 });
    }

    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    const ticketPriority = validPriorities.includes(priority) ? priority : 'normal';

    // Générer le numéro de ticket
    const counter = await prisma.counter.update({
      where: { name: 'ticket_number' },
      data: { value: { increment: 1 } },
    });

    // Créer le ticket avec le premier message (utiliser les textes sanitized)
    const ticket = await prisma.ticket.create({
      data: {
        number: counter.value,
        subject: sanitizedSubject,
        category,
        priority: ticketPriority,
        status: 'open',
        userId: user.id,
        messages: {
          create: {
            content: sanitizedMessage,
            authorId: user.id,
            isInternal: false,
          },
        },
      },
      include: {
        messages: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    // Importer les helpers de notification (dynamique pour éviter les erreurs de build)
    const { notifyAdminsWithPermission, NotificationTypes } = await import('@/lib/notification-helpers');
    const notificationManager = (await import('@/lib/notification-manager')).default;

    // Notifier tous les admins avec la permission de voir les tickets
    const createdNotifications = await notifyAdminsWithPermission(
      'tickets.view',
      NotificationTypes.TICKET_NEW,
      ticket.id,
      ticket.number,
      ticket.subject
    );

    // Envoyer la notification en temps réel via SSE avec les vrais IDs
    const { getUsersWithPermission } = await import('@/lib/notification-helpers');
    const adminIds = await getUsersWithPermission('tickets.view');

    for (const adminId of adminIds) {
      // Trouver la notification créée pour cet admin
      const notification = createdNotifications.find((n: any) => n.userId === adminId);

      notificationManager.sendToUser(adminId, {
        id: notification?.id, // Vrai ID de la base de données
        type: 'ticket_new',
        ticketId: ticket.id,
        ticketNumber: ticket.number,
        title: `Nouveau ticket #${ticket.number}`,
        message: ticket.subject,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/tickets:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
