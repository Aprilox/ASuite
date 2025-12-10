'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';
import { useAdmin } from '@/hooks/use-admin';
import {
  ArrowLeft,
  Shield,
  Save,
  Loader2,
  Check,
  Users,
  Lock,
  Settings,
  Ticket,
  Eye,
  LayoutDashboard,
} from 'lucide-react';

interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string;
}

interface RoleUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

interface RoleDetail {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  color: string;
  isSystem: boolean;
  permissions: Permission[];
  users: RoleUser[];
  createdAt: string;
  updatedAt: string;
}

const moduleIcons: Record<string, typeof Shield> = {
  users: Users,
  roles: Shield,
  tickets: Ticket,
  settings: Settings,
  audit: Eye,
  admin: LayoutDashboard,
};

// Dépendances des permissions : permission → permissions requises
// admin.dashboard est TOUJOURS requis pour accéder au panel admin
const PERMISSION_DEPENDENCIES: Record<string, string[]> = {
  // Users - toutes nécessitent admin.dashboard
  'users.view': ['admin.dashboard'],
  'users.edit': ['users.view', 'admin.dashboard'],
  'users.block': ['users.view', 'admin.dashboard'],
  'users.delete': ['users.view', 'admin.dashboard'],
  'users.reset_password': ['users.view', 'admin.dashboard'],
  // Roles - toutes nécessitent admin.dashboard
  'roles.view': ['admin.dashboard'],
  'roles.create': ['roles.view', 'admin.dashboard'],
  'roles.edit': ['roles.view', 'admin.dashboard'],
  'roles.delete': ['roles.view', 'admin.dashboard'],
  'roles.assign': ['roles.view', 'users.view', 'admin.dashboard'],
  'roles.reorder': ['roles.view', 'admin.dashboard'],
  // Tickets - toutes nécessitent admin.dashboard
  'tickets.view': ['admin.dashboard'],
  'tickets.respond': ['tickets.view', 'admin.dashboard'],
  'tickets.close': ['tickets.view', 'admin.dashboard'],
  'tickets.delete': ['tickets.view', 'admin.dashboard'],
  // Settings - toutes nécessitent admin.dashboard
  'settings.view': ['admin.dashboard'],
  'settings.edit': ['settings.view', 'admin.dashboard'],
  // Audit - nécessite admin.dashboard
  'audit.view': ['admin.dashboard'],
};

// Permissions qui dépendent d'une autre : permission → permissions qui en dépendent
const PERMISSION_DEPENDENTS: Record<string, string[]> = {
  // Admin Dashboard - TOUT en dépend
  'admin.dashboard': [
    'users.view', 'users.edit', 'users.block', 'users.delete', 'users.reset_password',
    'roles.view', 'roles.create', 'roles.edit', 'roles.delete', 'roles.assign',
    'tickets.view', 'tickets.respond', 'tickets.close', 'tickets.delete',
    'settings.view', 'settings.edit',
    'audit.view',
  ],
  // Users
  'users.view': ['users.edit', 'users.block', 'users.delete', 'users.reset_password', 'roles.assign'],
  // Roles
  'roles.view': ['roles.create', 'roles.edit', 'roles.delete', 'roles.assign'],
  // Tickets
  'tickets.view': ['tickets.respond', 'tickets.close', 'tickets.delete'],
  // Settings
  'settings.view': ['settings.edit'],
};

interface RoleDetailClientProps {
  id: string;
}

export function RoleDetailClient({ id }: RoleDetailClientProps) {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('admin.roles');
  const { hasPermission, roles: userRoles } = useAdmin();
  
  // Permissions
  const canEdit = hasPermission('roles.edit');
  const canViewUsers = hasPermission('users.view');
  
  // Vérifier si c'est le propre rôle de l'utilisateur
  const isOwnRole = userRoles.some(r => r.id === id);

  const [role, setRole] = useState<RoleDetail | null>(null);
  const [allPermissions, setAllPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    fetchRole();
    fetchPermissions();
  }, [id]);

  const fetchRole = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/roles/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/admin/roles');
          return;
        }
        throw new Error('Erreur');
      }
      const data = await res.json();
      setRole(data.role);
      setEditDisplayName(data.role.displayName);
      setEditDescription(data.role.description || '');
      setEditColor(data.role.color);
      setSelectedPermissions(data.role.permissions.map((p: Permission) => p.code));
    } catch (error) {
      toast.error(t('loadError'));
      router.push('/admin/roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/admin/permissions');
      if (res.ok) {
        const data = await res.json();
        setAllPermissions(data.byModule);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const handleSave = async () => {
    if (!role) return;
    setSaving(true);

    try {
      // Pour les rôles système, on ne modifie que les paramètres visuels
      const payload = role.isSystem
        ? {
            displayName: editDisplayName,
            description: editDescription,
            color: editColor,
          }
        : {
            displayName: editDisplayName,
            description: editDescription,
            color: editColor,
            permissions: selectedPermissions,
          };

      const res = await fetch(`/api/admin/roles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(t('updateSuccess'));
        fetchRole();
      } else {
        const data = await res.json();
        toast.error(data.error || t('updateError'));
      }
    } catch (error) {
      toast.error(t('updateError'));
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (code: string) => {
    if (selectedPermissions.includes(code)) {
      // Décocher : retirer aussi les permissions qui dépendent de celle-ci
      const dependents = PERMISSION_DEPENDENTS[code] || [];
      const toRemove = new Set([code, ...dependents]);
      setSelectedPermissions(selectedPermissions.filter((p) => !toRemove.has(p)));
    } else {
      // Cocher : ajouter aussi les permissions requises
      const dependencies = PERMISSION_DEPENDENCIES[code] || [];
      const toAdd = new Set([code, ...dependencies]);
      // Ajouter récursivement les dépendances des dépendances
      dependencies.forEach((dep) => {
        const subDeps = PERMISSION_DEPENDENCIES[dep] || [];
        subDeps.forEach((sd) => toAdd.add(sd));
      });
      setSelectedPermissions([...new Set([...selectedPermissions, ...toAdd])]);
    }
  };

  const toggleModule = (module: string) => {
    const modulePerms = allPermissions[module]?.map((p) => p.code) || [];
    const allSelected = modulePerms.every((p) => selectedPermissions.includes(p));

    if (allSelected) {
      // Décocher tout le module : retirer aussi les permissions qui en dépendent
      const toRemove = new Set<string>();
      modulePerms.forEach((perm) => {
        toRemove.add(perm);
        const dependents = PERMISSION_DEPENDENTS[perm] || [];
        dependents.forEach((d) => toRemove.add(d));
      });
      setSelectedPermissions(selectedPermissions.filter((p) => !toRemove.has(p)));
    } else {
      // Cocher tout le module : ajouter aussi les dépendances requises
      const toAdd = new Set<string>();
      modulePerms.forEach((perm) => {
        toAdd.add(perm);
        const dependencies = PERMISSION_DEPENDENCIES[perm] || [];
        dependencies.forEach((dep) => {
          toAdd.add(dep);
          // Dépendances des dépendances
          const subDeps = PERMISSION_DEPENDENCIES[dep] || [];
          subDeps.forEach((sd) => toAdd.add(sd));
        });
      });
      setSelectedPermissions([...new Set([...selectedPermissions, ...toAdd])]);
    }
  };

  const colors = [
    '#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a',
    '#0d9488', '#0891b2', '#2563eb', '#7c3aed', '#c026d3',
    '#db2777', '#6366f1',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!role) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/roles')}
          className="p-2 rounded-lg hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${role.color}20` }}
        >
          <Shield className="w-6 h-6" style={{ color: role.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{role.displayName}</h1>
            {role.isSystem && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {t('systemRole')}
              </span>
            )}
          </div>
          <p className="text-muted-foreground">@{role.name}</p>
        </div>
        {/* Bouton enregistrer - nécessite roles.edit et pas propre rôle */}
        {canEdit && !isOwnRole && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {t('save')}
          </button>
        )}
      </div>

      {role.isSystem && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {t('systemRoleWarning')}
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            {t('systemRoleCanEditVisual')}
          </p>
        </div>
      )}

      {isOwnRole && !role.isSystem && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-4 flex items-center gap-3">
          <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {t('ownRoleWarning')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">{t('settings')}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t('displayName')}</label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  disabled={!canEdit || isOwnRole}
                  className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t('description')}</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={!canEdit || isOwnRole}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t('color')}</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => canEdit && !isOwnRole && setEditColor(color)}
                      disabled={!canEdit || isOwnRole}
                      className={`w-8 h-8 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        editColor === color ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Users with this role */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">
              {t('usersWithRole')} ({role.users.length})
            </h2>
            {role.users.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noUsersWithRole')}</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {role.users.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-2 rounded-lg ${canViewUsers ? 'hover:bg-accent cursor-pointer' : ''}`}
                    onClick={() => canViewUsers && router.push(`/admin/users/${user.id}`)}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="lg:col-span-2 bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">{t('permissions')}</h2>
          <div className="space-y-6">
            {Object.entries(allPermissions).map(([module, perms]) => {
              const Icon = moduleIcons[module] || Lock;
              const allSelected = perms.every((p) => selectedPermissions.includes(p.code));
              const someSelected = perms.some((p) => selectedPermissions.includes(p.code));

              return (
                <div key={module} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => canEdit && !role.isSystem && !isOwnRole && toggleModule(module)}
                    disabled={!canEdit || role.isSystem || isOwnRole}
                    className="w-full flex items-center gap-3 p-4 bg-muted/50 hover:bg-muted disabled:opacity-50 disabled:cursor-default"
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      allSelected
                        ? 'bg-primary border-primary'
                        : someSelected
                        ? 'bg-primary/50 border-primary'
                        : 'border-input'
                    }`}>
                      {(allSelected || someSelected) && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">{t(`modules.${module}`)}</span>
                    <span className="ml-auto text-sm text-muted-foreground">
                      {perms.filter((p) => selectedPermissions.includes(p.code)).length}/{perms.length}
                    </span>
                  </button>
                  <div className="divide-y">
                    {perms.map((perm) => {
                      const isSelected = selectedPermissions.includes(perm.code);
                      // Convertir les points en underscores pour les clés de traduction
                      const permKey = perm.code.replace(/\./g, '_');
                      return (
                        <button
                          key={perm.code}
                          onClick={() => canEdit && !role.isSystem && !isOwnRole && togglePermission(perm.code)}
                          disabled={!canEdit || role.isSystem || isOwnRole}
                          className="w-full flex items-center gap-3 p-3 pl-12 hover:bg-muted/30 disabled:opacity-50 disabled:cursor-default text-left"
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-primary border-primary' : 'border-input'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{t(`permissionNames.${permKey}`)}</p>
                            <p className="text-xs text-muted-foreground">{t(`permissionDescriptions.${permKey}`)}</p>
                          </div>
                          <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {perm.code}
                          </code>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

