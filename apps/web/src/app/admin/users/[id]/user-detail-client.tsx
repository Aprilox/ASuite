'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useAdmin } from '@/hooks/use-admin';

// Mapping des actions vers les clés de traduction
const ACTION_TRANSLATIONS: Record<string, string> = {
  // Stats
  'admin.stats.view': 'actionStatsView',
  // Users
  'admin.user.view': 'actionUserView',
  'admin.user.block': 'actionUserBlock',
  'admin.user.unblock': 'actionUserUnblock',
  'admin.user.reset_password': 'actionUserResetPassword',
  'admin.user.delete': 'actionUserDelete',
  'admin.user.edit': 'actionUserEdit',
  'admin.user.roles_updated': 'actionUserRolesUpdated',
  // Roles
  'admin.role.view': 'actionRoleView',
  'admin.role.create': 'actionRoleCreate',
  'admin.role.edit': 'actionRoleEdit',
  'admin.role.delete': 'actionRoleDelete',
  'admin.role.reorder': 'actionRoleReorder',
  // Tickets
  'admin.ticket.view': 'actionTicketView',
  'admin.ticket.update': 'actionTicketUpdate',
  'admin.ticket.respond': 'actionTicketRespond',
  'admin.ticket.internal_note': 'actionTicketInternalNote',
  'admin.ticket.delete': 'actionTicketDelete',
  'admin.tickets.bulk_status': 'actionTicketsBulkStatus',
  'admin.tickets.bulk_delete': 'actionTicketsBulkDelete',
  // Settings
  'admin.settings.view': 'actionSettingsView',
  'admin.settings.update': 'actionSettingsUpdate',
  'admin.settings.create': 'actionSettingsCreate',
  'admin.settings.smtp_test': 'actionSettingsSmtpTest',
  // Auth
  'auth.login': 'actionLogin',
  'auth.logout': 'actionLogout',
  'auth.register': 'actionRegister',
  'auth.password.change': 'actionPasswordChange',
  // Password reset
  'password_reset_request': 'actionPasswordResetRequest',
  'password_reset_complete': 'actionPasswordResetComplete',
  // Alias sans préfixe (pour compatibilité avec les anciens logs)
  'login': 'actionLogin',
  'logout': 'actionLogout',
  'register': 'actionRegister',
  'password_change': 'actionPasswordChange',
};
import {
  ArrowLeft,
  User as UserIcon,
  Shield,
  Mail,
  Calendar,
  Globe,
  Monitor,
  Loader2,
  Ban,
  Unlock,
  Trash2,
  Save,
  Link2,
  Lock,
  Ticket,
  Clock,
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  displayName: string;
  color: string;
  isSystem: boolean;
}

interface UserDetail {
  id: string;
  email: string;
  emailVerified: string | null;
  name: string | null;
  image: string | null;
  theme: string;
  locale: string;
  isBlocked: boolean;
  blockedReason: string | null;
  blockedAt: string | null;
  blockedBy: string | null;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  twoFactorEnabled: boolean;
  ssoProvider: string | null;
  createdAt: string;
  updatedAt: string;
  roles: Role[];
  stats: {
    links: number;
    vaults: number;
    tickets: number;
    sessions: number;
  };
}

interface AuditLog {
  id: string;
  action: string;
  resource: string | null;
  resourceId: string | null;
  resourceName?: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface Session {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  expires: string;
}

interface UserDetailClientProps {
  id: string;
}

export function UserDetailClient({ id }: UserDetailClientProps) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const t = useTranslations('admin.users');
  const tActions = useTranslations('admin.dashboard');
  const { hasPermission, canActOnUser: checkCanActOnUser, userId: currentUserId } = useAdmin();

  // Permissions de l'utilisateur
  const canBlock = hasPermission('users.block');
  const canDelete = hasPermission('users.delete');
  const canResetPassword = hasPermission('users.reset_password');
  const canEdit = hasPermission('users.edit');
  const canAssignRoles = hasPermission('roles.assign');

  const [user, setUser] = useState<UserDetail | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit state
  const [editName, setEditName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Calculer si on peut agir sur cet utilisateur (hiérarchie)
  const getUserPriority = (u: UserDetail | null) => {
    if (!u || u.roles.length === 0) return 999;
    const priorities = u.roles.map(r => (r as { priority?: number }).priority ?? 100);
    return Math.min(...priorities);
  };

  const canActOnThisUser = user ? checkCanActOnUser(user.id, getUserPriority(user)) : false;

  useEffect(() => {
    fetchUser();
    fetchRoles();
  }, [id]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/admin/users');
          return;
        }
        throw new Error('Erreur');
      }
      const data = await res.json();
      setUser(data.user);
      setAuditLogs(data.auditLogs);
      setSessions(data.sessions);
      setEditName(data.user.name || '');
      setSelectedRoles(data.user.roles.filter((r: Role) => !r.isSystem).map((r: Role) => r.id));
    } catch (error) {
      toast.error(t('loadError'));
      router.push('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        setAllRoles(data.roles.filter((r: Role) => !r.isSystem));
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          roles: selectedRoles,
        }),
      });

      if (res.ok) {
        toast.success(t('updateSuccess'));
        fetchUser();
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

  const handleAction = async (action: string, reason?: string) => {
    if (!user) return;
    setActionLoading(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId: user.id, reason }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        if (action === 'delete') {
          router.push('/admin/users');
        } else {
          fetchUser();
        }
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error(t('actionError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!user) return;
    const confirmed = await confirm({
      title: t('blockUser'),
      message: t('blockConfirm', { email: user.email }),
      confirmText: t('block'),
      cancelText: t('cancel'),
      variant: 'danger',
    });

    if (confirmed) {
      await handleAction('block', 'Bloqué par un administrateur');
    }
  };

  const handleUnblock = async () => {
    await handleAction('unblock');
  };

  const handleDelete = async () => {
    if (!user) return;
    const confirmed = await confirm({
      title: t('deleteUser'),
      message: t('deleteConfirm', { email: user.email }),
      confirmText: t('delete'),
      cancelText: t('cancel'),
      variant: 'danger',
    });

    if (confirmed) {
      await handleAction('delete');
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;
    const confirmed = await confirm({
      title: t('resetPassword'),
      message: t('resetPasswordConfirm', { email: user.email }),
      confirmText: t('sendEmail'),
      cancelText: t('cancel'),
    });

    if (confirmed) {
      await handleAction('reset_password');
    }
  };

  const isProtected = user?.roles.some((r) => r.isSystem);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/users')}
          className="p-2 rounded-lg hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{user.name || user.email}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        {!isProtected && canActOnThisUser && (canBlock || canDelete) && (
          <div className="flex items-center gap-2">
            {/* Bloquer/Débloquer - nécessite users.block */}
            {canBlock && (
              user.isBlocked ? (
                <button
                  onClick={handleUnblock}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <Unlock className="w-4 h-4" />
                  {t('unblock')}
                </button>
              ) : (
                <button
                  onClick={handleBlock}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  <Ban className="w-4 h-4" />
                  {t('block')}
                </button>
              )
            )}
            {/* Supprimer - nécessite users.delete */}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {t('delete')}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">{t('profile')}</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t('displayName')}</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={isProtected || !canEdit || !canActOnThisUser}
                  className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">{t('email')}</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full h-10 px-4 rounded-lg border border-input bg-muted text-sm"
                />
              </div>

              {/* Rôles - nécessite roles.assign et droit hiérarchique */}
              {!isProtected && canActOnThisUser && canAssignRoles && (
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('roles')}</label>
                  <div className="flex flex-wrap gap-2">
                    {allRoles.map((role) => (
                      <label
                        key={role.id}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${selectedRoles.includes(role.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-input hover:bg-accent'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRoles([...selectedRoles, role.id]);
                            } else {
                              setSelectedRoles(selectedRoles.filter((r) => r !== role.id));
                            }
                          }}
                          className="sr-only"
                        />
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: role.color }}
                        />
                        <span className="text-sm">{role.displayName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton enregistrer - nécessite users.edit ou roles.assign et droit hiérarchique */}
              {!isProtected && canActOnThisUser && (canEdit || canAssignRoles) && (
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
          </div>

          {/* Activity */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">{t('recentActivity')}</h2>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noActivity')}</p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => {
                  const actionKey = ACTION_TRANSLATIONS[log.action];
                  const actionText = actionKey ? tActions(actionKey) : log.action;

                  // Construire l'affichage de la ressource
                  let resourceDisplay = null;
                  if (log.resource) {
                    if (log.resourceName) {
                      // Si on a le nom, l'afficher
                      resourceDisplay = `${log.resource}: ${log.resourceName}`;
                    } else if (log.resourceId) {
                      // Sinon, afficher l'ID raccourci
                      resourceDisplay = `${log.resource} (${log.resourceId.slice(0, 8)}...)`;
                    } else {
                      resourceDisplay = log.resource;
                    }
                  }

                  return (
                    <div key={log.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <p className="font-medium">{actionText}</p>
                        {resourceDisplay && (
                          <p className="text-muted-foreground">
                            {resourceDisplay}
                          </p>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">{t('statistics')}</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">{user.stats.links}</p>
                  <p className="text-xs text-muted-foreground">{t('links')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium">{user.stats.vaults}</p>
                  <p className="text-xs text-muted-foreground">{t('vaults')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium">{user.stats.tickets}</p>
                  <p className="text-xs text-muted-foreground">{t('tickets')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">{t('information')}</h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">{t('createdAt')}</p>
                  <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">{t('lastLogin')}</p>
                  <p>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">{t('lastIp')}</p>
                  <p>{user.lastLoginIp || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">{t('activeSessions')}</p>
                  <p>{sessions.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {/* Actions rapides - nécessite users.reset_password et droit hiérarchique */}
          {!isProtected && canActOnThisUser && canResetPassword && (
            <div className="bg-card rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">{t('quickActions')}</h2>
              <div className="space-y-2">
                <button
                  onClick={handleResetPassword}
                  disabled={actionLoading}
                  className="w-full inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                  {t('resetPassword')}
                </button>
              </div>
            </div>
          )}

          {/* Protected Badge */}
          {isProtected && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-600">
                <Shield className="w-5 h-5" />
                <span className="font-medium">{t('protectedAccount')}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t('protectedDescription')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

