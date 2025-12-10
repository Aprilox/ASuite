import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { 
  requireAdminPermission, 
  getRequestInfo, 
  createAuditLog,
  getAdminSession
} from '@/lib/admin-auth';

// GET /api/admin/tickets/[id] - Détail d'un ticket
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission('tickets.view');
    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            createdAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                email: true,
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

    return NextResponse.json({
      ticket: {
        ...ticket,
        messages: ticket.messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          isInternal: msg.isInternal,
          createdAt: msg.createdAt.toISOString(),
          author: {
            id: msg.author.id,
            email: msg.author.email,
            name: msg.author.name,
            image: msg.author.image,
            isStaff: msg.author.userRoles.length > 0,
            role: msg.author.userRoles[0]?.role || null,
          },
        })),
      },
    });
  } catch (error) {
    console.error('Admin ticket detail error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/admin/tickets/[id] - Modifier le statut d'un ticket
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminPermission('tickets.close');
    const { ipAddress, userAgent } = getRequestInfo(request);
    const { id } = await params;
    const body = await request.json();

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket non trouvé' }, { status: 404 });
    }

    const { status, priority } = body;
    const updates: Record<string, unknown> = {};

    if (status) {
      const validStatuses = ['open', 'in_progress', 'pending', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
      }
      updates.status = status;
    }

    if (priority) {
      const validPriorities = ['low', 'normal', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json({ error: 'Priorité invalide' }, { status: 400 });
      }
      updates.priority = priority;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updates,
    });

    await createAuditLog(
      admin.id,
      'admin.ticket.update',
      'ticket',
      id,
      { number: ticket.number, updates },
      ipAddress,
      userAgent
    );

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (error) {
    console.error('Admin ticket update error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/tickets/[id] - Répondre à un ticket
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminPermission('tickets.respond');
    const { ipAddress, userAgent } = getRequestInfo(request);
    const { id } = await params;
    const body = await request.json();

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket non trouvé' }, { status: 404 });
    }

    const { content, isInternal } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Contenu requis' }, { status: 400 });
    }

    // Créer le message
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        authorId: admin.id,
        content: content.trim(),
        isInternal: isInternal || false,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Si c'est une réponse publique, mettre le ticket en "in_progress" s'il était "open"
    if (!isInternal && ticket.status === 'open') {
      await prisma.ticket.update({
        where: { id },
        data: { status: 'in_progress' },
      });
    }

    await createAuditLog(
      admin.id,
      isInternal ? 'admin.ticket.internal_note' : 'admin.ticket.respond',
      'ticket',
      id,
      { number: ticket.number, messageId: message.id },
      ipAddress,
      userAgent
    );

    return NextResponse.json({ 
      success: true, 
      message: {
        id: message.id,
        content: message.content,
        isInternal: message.isInternal,
        createdAt: message.createdAt.toISOString(),
        author: message.author,
      },
    });
  } catch (error) {
    console.error('Admin ticket respond error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/admin/tickets/[id] - Supprimer un ticket
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminPermission('tickets.delete');
    const { ipAddress, userAgent } = getRequestInfo(request);
    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket non trouvé' }, { status: 404 });
    }

    await prisma.ticket.delete({
      where: { id },
    });

    await createAuditLog(
      admin.id,
      'admin.ticket.delete',
      'ticket',
      id,
      { number: ticket.number, subject: ticket.subject },
      ipAddress,
      userAgent
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin ticket delete error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

