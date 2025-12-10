import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { requireAdminPermission } from '@/lib/admin-auth';

// GET /api/admin/permissions - Liste des permissions disponibles
export async function GET() {
  try {
    await requireAdminPermission('roles.view');

    const permissions = await prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { code: 'asc' },
      ],
    });

    // Grouper par module
    const grouped: Record<string, typeof permissions> = {};
    for (const perm of permissions) {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    }

    return NextResponse.json({
      permissions,
      byModule: grouped,
    });
  } catch (error) {
    console.error('Admin permissions list error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}




