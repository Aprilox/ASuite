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

    if (!message || message.trim().length < 2) {
      return NextResponse.json({ error: 'Message trop court' }, { status: 400 });
    }

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

    // Ajouter le message
    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        authorId: user.id,
        content: message.trim(),
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

    // Mettre à jour le statut si nécessaire (passe en "open" si était "resolved" ou "pending")
    if (['resolved', 'pending'].includes(ticket.status)) {
      await prisma.ticket.update({
        where: { id },
        data: { status: 'open' },
      });
    }

    return NextResponse.json({ message: newMessage });
  } catch (error) {
    console.error('Erreur POST /api/tickets/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

