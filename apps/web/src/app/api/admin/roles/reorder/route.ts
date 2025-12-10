import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { 
  requireAdminPermission, 
  getRequestInfo, 
  createAuditLog,
  getAdminSession
} from '@/lib/admin-auth';

// POST /api/admin/roles/reorder - Réorganiser les priorités des rôles
export async function POST(request: Request) {
  try {
    const admin = await requireAdminPermission('roles.reorder');
    const { ipAddress, userAgent } = getRequestInfo(request);
    const body = await request.json();

    const { newOrder } = body;

    if (!newOrder || !Array.isArray(newOrder) || newOrder.length === 0) {
      return NextResponse.json(
        { error: 'Nouvel ordre requis' },
        { status: 400 }
      );
    }

    // Vérifier les droits de hiérarchie
    const currentAdmin = await getAdminSession();
    if (!currentAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Récupérer tous les rôles concernés
    const roles = await prisma.role.findMany({
      where: { id: { in: newOrder } },
    });

    // Vérifier que tous les rôles existent et ne sont pas système
    for (const roleId of newOrder) {
      const role = roles.find(r => r.id === roleId);
      if (!role) {
        return NextResponse.json(
          { error: `Rôle non trouvé: ${roleId}`, errorKey: 'roleNotFound' },
          { status: 404 }
        );
      }
      if (role.isSystem) {
        return NextResponse.json(
          { error: 'Impossible de réorganiser les rôles système', errorKey: 'cannotReorderSystemRole' },
          { status: 403 }
        );
      }
      
      // Vérifier que l'admin peut agir sur ce rôle
      const rolePriority = (role as { priority?: number }).priority ?? 100;
      if (rolePriority <= currentAdmin.highestPriority) {
        return NextResponse.json(
          { error: 'Vous ne pouvez pas réorganiser des rôles de rang supérieur ou égal au vôtre', errorKey: 'cannotReorderHigherRole' },
          { status: 403 }
        );
      }
    }

    // La priorité minimale pour les rôles non-admin est currentAdmin.highestPriority + 1
    const minPriority = currentAdmin.highestPriority + 1;
    
    // Mettre à jour les priorités dans l'ordre reçu
    const updates = newOrder.map((roleId, index) => {
      const newPriority = minPriority + index;
      return prisma.role.update({
        where: { id: roleId },
        data: { priority: newPriority } as Parameters<typeof prisma.role.update>[0]['data'],
      });
    });

    await prisma.$transaction(updates);

    await createAuditLog(
      admin.id,
      'admin.role.reorder',
      'role',
      newOrder[0],
      { 
        newOrder,
        rolesCount: newOrder.length,
      },
      ipAddress,
      userAgent
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin role reorder error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
