import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { 
  requireAdminPermission, 
  getRequestInfo, 
  createAuditLog 
} from '@/lib/admin-auth';

// GET /api/admin/tickets - Liste des tickets
export async function GET(request: Request) {
  try {
    await requireAdminPermission('tickets.view');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { user: { email: { contains: search } } },
        { user: { name: { contains: search } } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    return NextResponse.json({
      tickets: tickets.map((ticket) => ({
        ...ticket,
        messageCount: ticket._count.messages,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin tickets list error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/tickets - Actions sur les tickets (changer statut en lot)
export async function POST(request: Request) {
  try {
    const admin = await requireAdminPermission('tickets.close');
    const { ipAddress, userAgent } = getRequestInfo(request);
    const body = await request.json();

    const { action, ticketIds, status } = body;

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json({ error: 'IDs de tickets requis' }, { status: 400 });
    }

    switch (action) {
      case 'update_status': {
        if (!status) {
          return NextResponse.json({ error: 'Statut requis' }, { status: 400 });
        }

        const validStatuses = ['open', 'in_progress', 'pending', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) {
          return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
        }

        await prisma.ticket.updateMany({
          where: { id: { in: ticketIds } },
          data: { status },
        });

        await createAuditLog(
          admin.id,
          'admin.tickets.bulk_status',
          'ticket',
          undefined,
          { ticketIds, status },
          ipAddress,
          userAgent
        );

        return NextResponse.json({ 
          success: true, 
          message: `${ticketIds.length} ticket(s) mis à jour` 
        });
      }

      case 'delete': {
        await requireAdminPermission('tickets.delete');

        await prisma.ticket.deleteMany({
          where: { id: { in: ticketIds } },
        });

        await createAuditLog(
          admin.id,
          'admin.tickets.bulk_delete',
          'ticket',
          undefined,
          { ticketIds },
          ipAddress,
          userAgent
        );

        return NextResponse.json({ 
          success: true, 
          message: `${ticketIds.length} ticket(s) supprimé(s)` 
        });
      }

      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin tickets action error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}




