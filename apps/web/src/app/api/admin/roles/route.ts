import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { 
  requireAdminPermission, 
  getRequestInfo, 
  createAuditLog,
  getAdminSession
} from '@/lib/admin-auth';

// GET /api/admin/roles - Liste des rôles
export async function GET() {
  try {
    await requireAdminPermission('roles.view');

    const roles = await prisma.role.findMany({
      orderBy: [
        { priority: 'asc' } as const,
        { isSystem: 'desc' } as const,
        { name: 'asc' } as const,
      ],
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    return NextResponse.json({
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        color: role.color,
        isSystem: role.isSystem,
        priority: (role as { priority?: number }).priority ?? 100,
        permissions: role.permissions.map((rp) => rp.permission.code),
        userCount: role._count.users,
        createdAt: role.createdAt.toISOString(),
        updatedAt: role.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Admin roles list error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/roles - Créer un rôle
export async function POST(request: Request) {
  try {
    const admin = await requireAdminPermission('roles.create');
    const { ipAddress, userAgent } = getRequestInfo(request);
    const body = await request.json();

    const { name, displayName, description, color, permissions } = body;

    // Validation
    if (!name || !displayName) {
      return NextResponse.json(
        { error: 'Nom et nom d\'affichage requis' },
        { status: 400 }
      );
    }

    // Vérifier si le nom existe déjà
    const existing = await prisma.role.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Un rôle avec ce nom existe déjà' },
        { status: 400 }
      );
    }

    // Récupérer la priorité de l'admin actuel
    const currentAdmin = await getAdminSession();
    if (!currentAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // La priorité du nouveau rôle doit être strictement supérieure à celle de l'admin
    // Plus le nombre est grand, moins le rôle est important
    const newPriority = Math.max(currentAdmin.highestPriority + 1, 100);

    // Créer le rôle avec une priorité inférieure à l'admin
    const role = await prisma.role.create({
      data: {
        name,
        displayName,
        description: description || null,
        color: color || '#6366f1',
        isSystem: false,
        priority: newPriority,
      } as Parameters<typeof prisma.role.create>[0]['data'],
    });

    // Ajouter les permissions si fournies
    if (permissions && Array.isArray(permissions)) {
      const permissionRecords = await prisma.permission.findMany({
        where: { code: { in: permissions } },
      });

      await prisma.rolePermission.createMany({
        data: permissionRecords.map((p) => ({
          roleId: role.id,
          permissionId: p.id,
        })),
      });
    }

    await createAuditLog(
      admin.id,
      'admin.role.create',
      'role',
      role.id,
      { name, displayName, permissions },
      ipAddress,
      userAgent
    );

    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error('Admin role create error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

