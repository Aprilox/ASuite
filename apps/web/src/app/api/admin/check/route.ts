import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@asuite/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    
    // getSession() retourne directement AuthUser, pas { user: AuthUser }
    if (!session) {
      return NextResponse.json({ isAdmin: false, permissions: [] });
    }

    console.log('Admin check - session:', { userId: session.id, email: session.email });

    // Récupérer les rôles et permissions de l'utilisateur
    const userWithRoles = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userWithRoles) {
      console.log('Admin check - user not found in DB');
      return NextResponse.json({ isAdmin: false, permissions: [] });
    }

    // Collecter toutes les permissions et priorités
    const permissions = new Set<string>();
    let isAdmin = false;
    const priorities: number[] = [];

    console.log('Admin check - userRoles:', userWithRoles.userRoles.map(ur => ur.role.name));

    for (const userRole of userWithRoles.userRoles) {
      if (userRole.role.name === 'admin') {
        isAdmin = true;
      }
      // Récupérer la priorité du rôle
      const priority = (userRole.role as { priority?: number }).priority ?? 100;
      priorities.push(priority);
      
      for (const rolePermission of userRole.role.permissions) {
        permissions.add(rolePermission.permission.code);
      }
    }

    // Calculer la plus haute priorité (plus bas = plus important)
    const highestPriority = priorities.length > 0 ? Math.min(...priorities) : 999;

    // Vérifier aussi la permission admin.dashboard
    const hasAdminDashboard = permissions.has('admin.dashboard');

    return NextResponse.json({
      isAdmin: isAdmin || hasAdminDashboard,
      permissions: Array.from(permissions),
      roles: userWithRoles.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        displayName: ur.role.displayName,
        priority: (ur.role as { priority?: number }).priority ?? 100,
      })),
      highestPriority,
      userId: session.id,
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({ isAdmin: false, permissions: [] });
  }
}
