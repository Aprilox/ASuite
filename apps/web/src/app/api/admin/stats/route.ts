import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { requireAdminAccess, getRequestInfo, createAuditLog, hasPermission } from '@/lib/admin-auth';

export async function GET(request: Request) {
  try {
    const admin = await requireAdminAccess();
    const { ipAddress, userAgent } = getRequestInfo(request);
    
    // Vérifier si l'utilisateur a la permission de voir les logs d'audit
    const canViewAudit = await hasPermission('audit.view');

    // Statistiques générales
    const [
      totalUsers,
      blockedUsers,
      newUsersToday,
      newUsersThisWeek,
      totalTickets,
      openTickets,
      totalLinks,
      totalVaults,
      totalRoles,
      recentLogins,
    ] = await Promise.all([
      // Utilisateurs
      prisma.user.count(),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Tickets
      prisma.ticket.count(),
      prisma.ticket.count({
        where: {
          status: { in: ['open', 'in_progress', 'pending'] },
        },
      }),
      // Contenus
      prisma.link.count(),
      prisma.vault.count(),
      // Rôles
      prisma.role.count(),
      // Connexions récentes
      prisma.auditLog.count({
        where: {
          action: 'login',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Tickets par statut
    const ticketsByStatus = await prisma.ticket.groupBy({
      by: ['status'],
      _count: true,
    });

    // Tickets par priorité (pour les ouverts)
    const ticketsByPriority = await prisma.ticket.groupBy({
      by: ['priority'],
      where: {
        status: { in: ['open', 'in_progress', 'pending'] },
      },
      _count: true,
    });

    // Activité récente (seulement si permission audit.view)
    let recentActivity: Array<{
      id: string;
      action: string;
      createdAt: Date;
      user: { email: string; name: string | null } | null;
    }> = [];
    
    if (canViewAudit) {
      recentActivity = await prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: {
          action: { startsWith: 'admin.' },
        },
        include: {
          user: {
            select: { email: true, name: true },
          },
        },
      });
    }

    // Nouveaux utilisateurs par jour (7 derniers jours)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const usersByDay = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      _count: true,
    });

    // Log d'audit
    await createAuditLog(
      admin.id,
      'admin.stats.view',
      undefined,
      undefined,
      undefined,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      users: {
        total: totalUsers,
        blocked: blockedUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
      },
      tickets: {
        total: totalTickets,
        open: openTickets,
        byStatus: ticketsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byPriority: ticketsByPriority.reduce((acc, item) => {
          acc[item.priority] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
      content: {
        links: totalLinks,
        vaults: totalVaults,
      },
      roles: totalRoles,
      activity: {
        loginsToday: recentLogins,
        recent: recentActivity.map((log) => ({
          id: log.id,
          action: log.action,
          user: log.user ? { email: log.user.email, name: log.user.name } : null,
          createdAt: log.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

