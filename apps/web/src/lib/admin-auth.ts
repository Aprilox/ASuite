import { cookies } from 'next/headers';
import { prisma } from '@asuite/database';

export interface AdminRole {
  id: string;
  name: string;
  displayName: string;
  color: string;
  isSystem: boolean;
  priority: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  isBlocked: boolean;
  roles: AdminRole[];
  permissions: string[];
  highestPriority: number; // Plus bas = plus important (admin = 0)
}

/**
 * Récupère l'utilisateur admin avec ses rôles et permissions
 */
export async function getAdminSession(): Promise<AdminUser | null> {
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
        },
      },
    });

    if (!session || session.expires < new Date()) {
      return null;
    }

    const user = session.user;

    // Vérifier si l'utilisateur est bloqué
    if (user.isBlocked) {
      return null;
    }

    // Extraire les rôles avec priorité
    const roles = user.userRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      displayName: ur.role.displayName,
      color: ur.role.color,
      isSystem: ur.role.isSystem,
      priority: (ur.role as { priority?: number }).priority ?? 100,
    }));

    // Calculer la plus haute priorité (plus bas = plus important)
    const highestPriority = roles.length > 0 
      ? Math.min(...roles.map(r => r.priority)) 
      : 999;

    // Extraire les permissions uniques
    const permissionSet = new Set<string>();
    for (const userRole of user.userRoles) {
      for (const rp of userRole.role.permissions) {
        permissionSet.add(rp.permission.code);
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isBlocked: user.isBlocked,
      roles,
      permissions: Array.from(permissionSet),
      highestPriority,
    };
  } catch (error) {
    console.error('Error getting admin session:', error);
    return null;
  }
}

/**
 * Vérifie si l'utilisateur a accès à l'administration
 */
export async function hasAdminAccess(): Promise<boolean> {
  const user = await getAdminSession();
  if (!user) return false;
  return user.permissions.includes('admin.dashboard');
}

/**
 * Vérifie si l'utilisateur a une permission spécifique
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const user = await getAdminSession();
  if (!user) return false;
  
  // Les admins système ont toutes les permissions
  if (user.roles.some((r) => r.isSystem)) {
    return true;
  }
  
  return user.permissions.includes(permission);
}

/**
 * Vérifie si l'utilisateur a au moins une des permissions spécifiées
 */
export async function hasAnyPermission(permissions: string[]): Promise<boolean> {
  const user = await getAdminSession();
  if (!user) return false;
  
  // Les admins système ont toutes les permissions
  if (user.roles.some((r) => r.isSystem)) {
    return true;
  }
  
  return permissions.some((p) => user.permissions.includes(p));
}

/**
 * Vérifie si l'utilisateur a toutes les permissions spécifiées
 */
export async function hasAllPermissions(permissions: string[]): Promise<boolean> {
  const user = await getAdminSession();
  if (!user) return false;
  
  // Les admins système ont toutes les permissions
  if (user.roles.some((r) => r.isSystem)) {
    return true;
  }
  
  return permissions.every((p) => user.permissions.includes(p));
}

/**
 * Vérifie si l'utilisateur est un administrateur système
 */
export async function isSystemAdmin(): Promise<boolean> {
  const user = await getAdminSession();
  if (!user) return false;
  return user.roles.some((r) => r.isSystem);
}

/**
 * Vérifie si l'utilisateur cible est un admin système (protégé)
 */
export async function isTargetUserProtected(targetUserId: string): Promise<boolean> {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!targetUser) return false;
  return targetUser.userRoles.some((ur) => ur.role.isSystem);
}

/**
 * Récupère la plus haute priorité (plus bas = plus important) d'un utilisateur cible
 */
export async function getTargetUserPriority(targetUserId: string): Promise<number> {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!targetUser || targetUser.userRoles.length === 0) return 999;
  
  const priorities = targetUser.userRoles.map(
    (ur) => (ur.role as { priority?: number }).priority ?? 100
  );
  return Math.min(...priorities);
}

/**
 * Vérifie si l'utilisateur actuel peut agir sur un utilisateur cible
 * - Ne peut pas agir sur soi-même
 * - Ne peut pas agir sur quelqu'un de priorité supérieure ou égale
 */
export async function canActOnUser(targetUserId: string): Promise<{ allowed: boolean; reason?: string }> {
  const currentUser = await getAdminSession();
  if (!currentUser) {
    return { allowed: false, reason: 'Non autorisé' };
  }

  // Ne peut pas agir sur soi-même
  if (currentUser.id === targetUserId) {
    return { allowed: false, reason: 'Vous ne pouvez pas modifier votre propre compte' };
  }

  // Récupérer la priorité de l'utilisateur cible
  const targetPriority = await getTargetUserPriority(targetUserId);

  // Ne peut pas agir sur quelqu'un de priorité supérieure ou égale
  if (targetPriority <= currentUser.highestPriority) {
    return { allowed: false, reason: 'Vous ne pouvez pas agir sur un utilisateur de rang supérieur ou égal' };
  }

  return { allowed: true };
}

/**
 * Récupère la priorité d'un rôle
 */
export async function getRolePriority(roleId: string): Promise<number> {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role) return 999;
  return (role as { priority?: number }).priority ?? 100;
}

/**
 * Vérifie si l'utilisateur actuel peut modifier/supprimer un rôle
 * - Ne peut pas modifier son propre rôle principal
 * - Ne peut pas modifier un rôle de priorité supérieure ou égale
 */
export async function canActOnRole(roleId: string): Promise<{ allowed: boolean; reason?: string; errorKey?: string }> {
  const currentUser = await getAdminSession();
  if (!currentUser) {
    return { allowed: false, reason: 'Non autorisé' };
  }

  // Vérifier si c'est un de ses propres rôles
  const hasRole = currentUser.roles.some(r => r.id === roleId);
  if (hasRole) {
    return { allowed: false, reason: 'Vous ne pouvez pas modifier votre propre rôle', errorKey: 'cannotModifyOwnRole' };
  }

  // Récupérer la priorité du rôle cible
  const rolePriority = await getRolePriority(roleId);

  // Ne peut pas modifier un rôle de priorité supérieure ou égale
  if (rolePriority <= currentUser.highestPriority) {
    return { allowed: false, reason: 'Vous ne pouvez pas modifier un rôle de rang supérieur ou égal', errorKey: 'cannotModifyHigherRole' };
  }

  return { allowed: true };
}

/**
 * Vérifie si l'utilisateur actuel peut attribuer un rôle à quelqu'un
 * - Ne peut pas attribuer un rôle de priorité supérieure ou égale à la sienne
 */
export async function canAssignRole(roleId: string): Promise<{ allowed: boolean; reason?: string }> {
  const currentUser = await getAdminSession();
  if (!currentUser) {
    return { allowed: false, reason: 'Non autorisé' };
  }

  // Récupérer la priorité du rôle à attribuer
  const rolePriority = await getRolePriority(roleId);

  // Ne peut pas attribuer un rôle de priorité supérieure ou égale
  if (rolePriority <= currentUser.highestPriority) {
    return { allowed: false, reason: 'Vous ne pouvez pas attribuer un rôle de rang supérieur ou égal au vôtre' };
  }

  return { allowed: true };
}

/**
 * Exige une permission spécifique, retourne une erreur sinon
 */
export async function requireAdminPermission(permission: string): Promise<AdminUser> {
  const user = await getAdminSession();
  
  if (!user) {
    throw new Error('Non autorisé');
  }
  
  // Les admins système ont toutes les permissions
  if (user.roles.some((r) => r.isSystem)) {
    return user;
  }
  
  if (!user.permissions.includes(permission)) {
    throw new Error('Permission insuffisante');
  }
  
  return user;
}

/**
 * Exige un accès admin de base
 */
export async function requireAdminAccess(): Promise<AdminUser> {
  return requireAdminPermission('admin.dashboard');
}

/**
 * Crée une entrée dans les logs d'audit
 */
export async function createAuditLog(
  userId: string | null,
  action: string,
  resource?: string,
  resourceId?: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

/**
 * Récupère les headers de la requête pour l'audit
 */
export function getRequestInfo(request: Request): { ipAddress: string; userAgent: string } {
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return { ipAddress, userAgent };
}

