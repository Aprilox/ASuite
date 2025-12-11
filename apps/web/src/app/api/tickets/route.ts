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

    // Validation
    if (!subject || subject.trim().length < 5) {
      return NextResponse.json({ error: 'Sujet trop court (min. 5 caractères)' }, { status: 400 });
    }

    if (!message || message.trim().length < 10) {
      return NextResponse.json({ error: 'Message trop court (min. 10 caractères)' }, { status: 400 });
    }

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

    // Créer le ticket avec le premier message
    const ticket = await prisma.ticket.create({
      data: {
        number: counter.value,
        subject: subject.trim(),
        category,
        priority: ticketPriority,
        status: 'open',
        userId: user.id,
        messages: {
          create: {
            content: message.trim(),
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

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/tickets:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

