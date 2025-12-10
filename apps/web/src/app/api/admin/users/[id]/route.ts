import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { 
  requireAdminPermission, 
  getRequestInfo, 
  createAuditLog,
  isTargetUserProtected,
  isSystemAdmin,
  canActOnUser,
  canAssignRole,
  getAdminSession
} from '@/lib/admin-auth';

// GET /api/admin/users/[id] - Détail d'un utilisateur
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission('users.view');
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        name: true,
        image: true,
        theme: true,
        locale: true,
        isBlocked: true,
        blockedReason: true,
        blockedAt: true,
        blockedBy: true,
        lastLoginAt: true,
        lastLoginIp: true,
        twoFactorEnabled: true,
        ssoProvider: true,
        createdAt: true,
        updatedAt: true,
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
        _count: {
          select: {
            links: true,
            vaults: true,
            tickets: true,
            sessions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Récupérer les derniers logs d'audit
    const auditLogs = await prisma.auditLog.findMany({
      where: { userId: id },
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        ipAddress: true,
        createdAt: true,
      },
    });

    // Récupérer les sessions actives
    const sessions = await prisma.session.findMany({
      where: { 
        userId: id,
        expires: { gt: new Date() },
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        expires: true,
      },
    });

    return NextResponse.json({
      user: {
        ...user,
        roles: user.userRoles.map((ur) => ur.role),
        userRoles: undefined,
        stats: user._count,
        _count: undefined,
      },
      auditLogs,
      sessions,
    });
  } catch (error) {
    console.error('Admin user detail error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] - Modifier un utilisateur
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminPermission('users.edit');
    const { ipAddress, userAgent } = getRequestInfo(request);
    const { id } = await params;
    const body = await request.json();

    // Vérifier les droits hiérarchiques
    const canAct = await canActOnUser(id);
    if (!canAct.allowed) {
      return NextResponse.json(
        { error: canAct.reason },
        { status: 403 }
      );
    }

    // Vérifier si l'utilisateur cible est protégé (admin système)
    const isProtected = await isTargetUserProtected(id);
    const currentIsSystemAdmin = await isSystemAdmin();

    if (isProtected && !currentIsSystemAdmin) {
      return NextResponse.json(
        { error: 'Impossible de modifier un administrateur système' },
        { status: 403 }
      );
    }

    const { name, roles } = body;
    const updates: Record<string, unknown> = {};

    if (name !== undefined) {
      updates.name = name;
    }

    // Mettre à jour l'utilisateur
    const user = await prisma.user.update({
      where: { id },
      data: updates,
    });

    // Mettre à jour les rôles si fournis
    if (roles !== undefined && Array.isArray(roles)) {
      await requireAdminPermission('roles.assign');

      // Vérifier que l'utilisateur peut attribuer chaque rôle (hiérarchie)
      for (const roleId of roles) {
        const canAssign = await canAssignRole(roleId);
        if (!canAssign.allowed) {
          return NextResponse.json(
            { error: canAssign.reason },
            { status: 403 }
          );
        }
      }

      // Supprimer les anciens rôles (sauf admin système si l'utilisateur l'a déjà)
      const existingRoles = await prisma.userRole.findMany({
        where: { userId: id },
        include: { role: true },
      });

      const systemRoles = existingRoles.filter((ur) => ur.role.isSystem);

      await prisma.userRole.deleteMany({
        where: { 
          userId: id,
          role: { isSystem: false },
        },
      });

      // Ajouter les nouveaux rôles (seulement ceux non-système et que l'utilisateur peut attribuer)
      const rolesToAdd = await prisma.role.findMany({
        where: { 
          id: { in: roles },
          isSystem: false,
        },
      });

      for (const role of rolesToAdd) {
        await prisma.userRole.create({
          data: {
            userId: id,
            roleId: role.id,
            grantedBy: admin.id,
          },
        });
      }

      await createAuditLog(
        admin.id,
        'admin.user.roles_updated',
        'user',
        id,
        { 
          targetEmail: user.email,
          roles: rolesToAdd.map((r) => r.name),
          keptSystemRoles: systemRoles.map((ur) => ur.role.name),
        },
        ipAddress,
        userAgent
      );
    }

    await createAuditLog(
      admin.id,
      'admin.user.edit',
      'user',
      id,
      { targetEmail: user.email, updates: Object.keys(updates) },
      ipAddress,
      userAgent
    );

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Admin user edit error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

