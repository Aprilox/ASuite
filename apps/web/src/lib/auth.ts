import { cookies } from 'next/headers';
import { prisma } from '@asuite/database';

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: Date | null;
  name: string | null;
  role: string;
  theme: string;
  locale: string;
}

/**
 * Détermine le rôle principal d'un utilisateur à partir de ses userRoles
 */
function getPrimaryRole(userRoles: Array<{ role: { name: string; isSystem: boolean } }>): string {
  if (!userRoles || userRoles.length === 0) {
    return 'user';
  }

  // Si l'utilisateur a un rôle système (admin), c'est son rôle principal
  const systemRole = userRoles.find((ur) => ur.role.isSystem);
  if (systemRole) {
    return systemRole.role.name;
  }

  // Sinon, retourner le premier rôle
  return userRoles[0].role.name;
}

export async function getSession(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: {
                  select: {
                    name: true,
                    isSystem: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session || session.expires < new Date()) {
      return null;
    }

    // Vérifier si l'utilisateur est bloqué
    if (session.user.isBlocked) {
      return null;
    }

    const role = getPrimaryRole(session.user.userRoles);

    return {
      id: session.user.id,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      name: session.user.name,
      role,
      theme: session.user.theme,
      locale: session.user.locale,
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getSession();
  if (!user) {
    throw new Error('Non autorisé');
  }
  return user;
}

/**
 * Vérifie si l'utilisateur a un rôle admin (pour compatibilité avec l'ancien système)
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getSession();
  return user?.role === 'admin';
}
