import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import {
  requireAdminPermission,
  getRequestInfo,
  createAuditLog,
  isTargetUserProtected,
  canActOnUser
} from '@/lib/admin-auth';
import { generatePasswordResetToken, sendPasswordResetEmail } from '@/lib/email';
import { checkGlobalRateLimit } from '@/lib/global-rate-limit';

// GET /api/admin/users - Liste des utilisateurs
export async function GET(request: Request) {
  try {
    await requireAdminPermission('users.view');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const blocked = searchParams.get('blocked');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Record<string, unknown> = {};

    // Recherche
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
      ];
    }

    // Filtre par rôle
    if (role) {
      where.userRoles = {
        some: {
          role: { name: role },
        },
      };
    }

    // Filtre par statut bloqué
    if (blocked === 'true') {
      where.isBlocked = true;
    } else if (blocked === 'false') {
      where.isBlocked = false;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          emailVerified: true,
          name: true,
          image: true,
          isBlocked: true,
          blockedReason: true,
          blockedAt: true,
          lastLoginAt: true,
          createdAt: true,
          userRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                  color: true,
                  isSystem: true,
                },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users: users.map((user) => {
        // Calculer la priorité la plus haute de l'utilisateur
        const priorities = user.userRoles.map(
          (ur) => (ur.role as { priority?: number }).priority ?? 100
        );
        const highestPriority = priorities.length > 0 ? Math.min(...priorities) : 999;

        return {
          ...user,
          roles: user.userRoles.map((ur) => ({
            ...ur.role,
            priority: (ur.role as { priority?: number }).priority ?? 100,
          })),
          userRoles: undefined,
          highestPriority,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin users list error:', error);

    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/users - Actions sur un utilisateur
export async function POST(request: Request) {
  try {
    const admin = await requireAdminPermission('users.view');
    const { ipAddress, userAgent } = getRequestInfo(request);
    const body = await request.json();
    const { action, userId, reason } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 });
    }

    // Vérifier si l'utilisateur cible existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        locale: true,
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Vérifier les droits hiérarchiques (soi-même + priorité)
    const canAct = await canActOnUser(userId);
    if (!canAct.allowed) {
      return NextResponse.json(
        { error: canAct.reason },
        { status: 403 }
      );
    }

    // Rate limiting - Vérifier les actions admin
    const rateLimitResult = await checkGlobalRateLimit('admin_action', admin.id);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.reason },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 900),
          },
        }
      );
    }

    // Vérifier si l'utilisateur cible est protégé (admin système)
    const isProtected = await isTargetUserProtected(userId);
    if (isProtected) {
      return NextResponse.json(
        { error: 'Impossible de modifier un administrateur système' },
        { status: 403 }
      );
    }

    switch (action) {
      case 'block': {
        await requireAdminPermission('users.block');

        await prisma.user.update({
          where: { id: userId },
          data: {
            isBlocked: true,
            blockedReason: reason || null,
            blockedAt: new Date(),
            blockedBy: admin.id,
          },
        });

        // Invalider toutes les sessions de l'utilisateur
        await prisma.session.deleteMany({
          where: { userId },
        });

        await createAuditLog(
          admin.id,
          'admin.user.block',
          'user',
          userId,
          { reason, targetEmail: targetUser.email },
          ipAddress,
          userAgent
        );

        return NextResponse.json({ success: true, message: 'Utilisateur bloqué' });
      }

      case 'unblock': {
        await requireAdminPermission('users.block');

        await prisma.user.update({
          where: { id: userId },
          data: {
            isBlocked: false,
            blockedReason: null,
            blockedAt: null,
            blockedBy: null,
          },
        });

        await createAuditLog(
          admin.id,
          'admin.user.unblock',
          'user',
          userId,
          { targetEmail: targetUser.email },
          ipAddress,
          userAgent
        );

        return NextResponse.json({ success: true, message: 'Utilisateur débloqué' });
      }

      case 'reset_password': {
        await requireAdminPermission('users.reset_password');

        const token = await generatePasswordResetToken(userId);
        if (!token) {
          return NextResponse.json(
            { error: 'Erreur lors de la génération du token' },
            { status: 500 }
          );
        }

        // Envoyer l'email dans la langue du client (pas celle de l'admin)
        await sendPasswordResetEmail(targetUser.email, targetUser.name, token, targetUser.locale || 'fr');

        await createAuditLog(
          admin.id,
          'admin.user.reset_password',
          'user',
          userId,
          { targetEmail: targetUser.email },
          ipAddress,
          userAgent
        );

        return NextResponse.json({
          success: true,
          message: 'Email de réinitialisation envoyé'
        });
      }

      case 'delete': {
        await requireAdminPermission('users.delete');

        // Supprimer l'utilisateur (cascade configurée dans Prisma)
        await prisma.user.delete({
          where: { id: userId },
        });

        await createAuditLog(
          admin.id,
          'admin.user.delete',
          'user',
          userId,
          { targetEmail: targetUser.email },
          ipAddress,
          userAgent
        );

        return NextResponse.json({ success: true, message: 'Utilisateur supprimé' });
      }

      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin users action error:', error);

    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

