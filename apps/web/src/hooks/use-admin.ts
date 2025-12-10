'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';

interface AdminRole {
  id: string;
  name: string;
  displayName: string;
  priority: number;
}

interface AdminStatus {
  isAdmin: boolean;
  isLoading: boolean;
  permissions: string[];
  roles: AdminRole[];
  highestPriority: number;
  userId: string | null;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
  canActOnUser: (targetUserId: string, targetPriority: number) => boolean;
  canActOnRole: (roleId: string, rolePriority: number) => boolean;
}

export function useAdmin(): AdminStatus {
  const { user, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [highestPriority, setHighestPriority] = useState(999);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!isAuthenticated || !user) {
        setIsAdmin(false);
        setPermissions([]);
        setRoles([]);
        setHighestPriority(999);
        setUserId(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/admin/check');
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin);
          setPermissions(data.permissions || []);
          setRoles(data.roles || []);
          setHighestPriority(data.highestPriority ?? 999);
          setUserId(data.userId || null);
        } else {
          setIsAdmin(false);
          setPermissions([]);
          setRoles([]);
          setHighestPriority(999);
          setUserId(null);
        }
      } catch {
        setIsAdmin(false);
        setPermissions([]);
        setRoles([]);
        setHighestPriority(999);
        setUserId(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminStatus();
  }, [isAuthenticated, user]);

  // Vérifier si l'utilisateur a une permission spécifique
  const hasPermission = useCallback((permission: string): boolean => {
    // Les admins système ont toutes les permissions
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  }, [permissions]);

  // Vérifier si l'utilisateur a au moins une des permissions
  const hasAnyPermission = useCallback((...perms: string[]): boolean => {
    if (permissions.includes('*')) return true;
    return perms.some((p) => permissions.includes(p));
  }, [permissions]);

  // Vérifier si l'utilisateur peut agir sur un utilisateur cible
  // - Ne peut pas agir sur soi-même
  // - Ne peut pas agir sur quelqu'un de priorité supérieure ou égale
  const canActOnUser = useCallback((targetUserId: string, targetPriority: number): boolean => {
    // Ne peut pas agir sur soi-même
    if (userId === targetUserId) return false;
    // Ne peut pas agir sur quelqu'un de priorité supérieure ou égale
    return targetPriority > highestPriority;
  }, [userId, highestPriority]);

  // Vérifier si l'utilisateur peut agir sur un rôle
  // - Ne peut pas agir sur ses propres rôles
  // - Ne peut pas agir sur un rôle de priorité supérieure ou égale
  const canActOnRole = useCallback((roleId: string, rolePriority: number): boolean => {
    // Ne peut pas agir sur ses propres rôles
    if (roles.some(r => r.id === roleId)) return false;
    // Ne peut pas agir sur un rôle de priorité supérieure ou égale
    return rolePriority > highestPriority;
  }, [roles, highestPriority]);

  return { 
    isAdmin, 
    isLoading, 
    permissions, 
    roles,
    highestPriority,
    userId,
    hasPermission, 
    hasAnyPermission,
    canActOnUser,
    canActOnRole
  };
}

