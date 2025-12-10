import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { 
  requireAdminPermission, 
  getRequestInfo, 
  createAuditLog,
  canActOnRole
} from '@/lib/admin-auth';

// GET /api/admin/roles/[id] - Détail d'un rôle
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission('roles.view');
    const { id } = await params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ error: 'Rôle non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      role: {
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        color: role.color,
        isSystem: role.isSystem,
        permissions: role.permissions.map((rp) => rp.permission),
        users: role.users.map((ur) => ur.user),
        createdAt: role.createdAt.toISOString(),
        updatedAt: role.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Admin role detail error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/admin/roles/[id] - Modifier un rôle
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminPermission('roles.edit');
    const { ipAddress, userAgent } = getRequestInfo(request);
    const { id } = await params;
    const body = await request.json();

    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      return NextResponse.json({ error: 'Rôle non trouvé' }, { status: 404 });
    }

    // Vérifier les droits hiérarchiques (sauf pour les rôles système où seules les modifications visuelles sont permises)
    if (!role.isSystem) {
      const canAct = await canActOnRole(id);
      if (!canAct.allowed) {
        return NextResponse.json(
          { error: canAct.reason },
          { status: 403 }
        );
      }
    }

    const { displayName, description, color, permissions } = body;
    const updates: Record<string, unknown> = {};

    // Pour les rôles système, on ne permet que les modifications visuelles
    if (displayName !== undefined) updates.displayName = displayName;
    if (description !== undefined) updates.description = description;
    if (color !== undefined) updates.color = color;

    // Mettre à jour le rôle
    const updatedRole = await prisma.role.update({
      where: { id },
      data: updates,
    });

    // Mettre à jour les permissions si fournies (sauf pour les rôles système)
    if (!role.isSystem && permissions !== undefined && Array.isArray(permissions)) {
      // Supprimer les anciennes permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // Ajouter les nouvelles permissions
      const permissionRecords = await prisma.permission.findMany({
        where: { code: { in: permissions } },
      });

      await prisma.rolePermission.createMany({
        data: permissionRecords.map((p) => ({
          roleId: id,
          permissionId: p.id,
        })),
      });
    }

    await createAuditLog(
      admin.id,
      'admin.role.edit',
      'role',
      id,
      { name: role.name, updates: Object.keys(updates), permissions },
      ipAddress,
      userAgent
    );

    return NextResponse.json({ success: true, role: updatedRole });
  } catch (error) {
    console.error('Admin role edit error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/admin/roles/[id] - Supprimer un rôle
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminPermission('roles.delete');
    const { ipAddress, userAgent } = getRequestInfo(request);
    const { id } = await params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
      },
    });

    if (!role) {
      return NextResponse.json({ error: 'Rôle non trouvé' }, { status: 404 });
    }

    // Empêcher la suppression des rôles système
    if (role.isSystem) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un rôle système' },
        { status: 403 }
      );
    }

    // Vérifier les droits hiérarchiques
    const canAct = await canActOnRole(id);
    if (!canAct.allowed) {
      return NextResponse.json(
        { error: canAct.reason },
        { status: 403 }
      );
    }

    // Vérifier si des utilisateurs ont ce rôle
    if (role._count.users > 0) {
      return NextResponse.json(
        { error: `Ce rôle est attribué à ${role._count.users} utilisateur(s)` },
        { status: 400 }
      );
    }

    // Supprimer le rôle (cascade supprime les rolePermissions)
    await prisma.role.delete({
      where: { id },
    });

    await createAuditLog(
      admin.id,
      'admin.role.delete',
      'role',
      id,
      { name: role.name },
      ipAddress,
      userAgent
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin role delete error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

