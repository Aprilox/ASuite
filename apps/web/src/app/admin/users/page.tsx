'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useAdmin } from '@/hooks/use-admin';
import {
  Search,
  MoreVertical,
  Ban,
  Unlock,
  Mail,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User as UserIcon,
  Shield,
  Calendar,
  Clock,
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  displayName: string;
  color: string;
  isSystem: boolean;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  isBlocked: boolean;
  blockedReason: string | null;
  blockedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  roles: Role[];
  highestPriority: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PAGE_SIZE_OPTIONS = [
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 9999, label: 'Tous' },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const t = useTranslations('admin.users');
  const { hasPermission, canActOnUser, userId: currentUserId } = useAdmin();
  
  // Permissions de l'utilisateur
  const canBlock = hasPermission('users.block');
  const canDelete = hasPermission('users.delete');
  const canResetPassword = hasPermission('users.reset_password');
  const canEdit = hasPermission('users.edit');

  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterBlocked, setFilterBlocked] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, search, filterRole, filterBlocked]);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set('search', search);
      if (filterRole) params.set('role', filterRole);
      if (filterBlocked) params.set('blocked', filterBlocked);

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, userId: string, reason?: string) => {
    setActionLoading(userId);
    setOpenMenu(null);
    setMenuPosition(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId, reason }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || t('actionSuccess'));
        fetchUsers();
      } else {
        toast.error(data.error || t('actionError'));
      }
    } catch (error) {
      toast.error(t('actionError'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlock = async (user: User) => {
    const confirmed = await confirm({
      title: t('blockUser'),
      message: t('blockConfirm', { email: user.email }),
      confirmText: t('block'),
      cancelText: t('cancel'),
      variant: 'danger',
    });

    if (confirmed) {
      await handleAction('block', user.id, 'Bloqué par un administrateur');
    }
  };

  const handleUnblock = async (user: User) => {
    await handleAction('unblock', user.id);
  };

  const handleResetPassword = async (user: User) => {
    const confirmed = await confirm({
      title: t('resetPassword'),
      message: t('resetPasswordConfirm', { email: user.email }),
      confirmText: t('sendEmail'),
      cancelText: t('cancel'),
    });

    if (confirmed) {
      await handleAction('reset_password', user.id);
    }
  };

  const handleDelete = async (user: User) => {
    const confirmed = await confirm({
      title: t('deleteUser'),
      message: t('deleteConfirm', { email: user.email }),
      confirmText: t('delete'),
      cancelText: t('cancel'),
      variant: 'danger',
    });

    if (confirmed) {
      await handleAction('delete', user.id);
    }
  };

  const isProtected = (user: User) => {
    return user.roles.some((r) => r.isSystem);
  };

  const handlePageSizeChange = (newLimit: number) => {
    setPagination((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }));
  };

  const openContextMenu = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    if (openMenu === userId) {
      setOpenMenu(null);
      setMenuPosition(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuHeight = 180;
      const menuWidth = 208;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceRight = window.innerWidth - rect.right;
      
      const openAbove = spaceBelow < menuHeight && rect.top > menuHeight;
      const openLeft = spaceRight < menuWidth;
      
      setMenuPosition({
        top: openAbove ? rect.top - menuHeight : rect.bottom + 4,
        left: openLeft ? rect.left - menuWidth + rect.width : rect.left,
      });
      setOpenMenu(userId);
    }
  };

  const renderUserActions = (user: User) => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => router.push(`/admin/users/${user.id}`)}
        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        title={t('viewDetails')}
      >
        <Eye className="w-4 h-4" />
      </button>

      {/* Menu 3 points - visible seulement si au moins une action est disponible ET qu'on peut agir sur cet utilisateur */}
      {!isProtected(user) && canActOnUser(user.id, user.highestPriority) && (canBlock || canDelete || canResetPassword) && (
        <button
          onClick={(e) => openContextMenu(e, user.id)}
          disabled={actionLoading === user.id}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {actionLoading === user.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MoreVertical className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border p-3 sm:p-4">
        {/* Mobile/Tablet: Stacked layout */}
        <div className="flex flex-col gap-3 xl:hidden">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {/* Filters - responsive grid */}
          <div className="grid grid-cols-3 gap-2">
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="h-10 px-2 rounded-lg border border-input bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring truncate"
            >
              <option value="">{t('allRoles')}</option>
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.displayName}
                </option>
              ))}
            </select>
            <select
              value={filterBlocked}
              onChange={(e) => {
                setFilterBlocked(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="h-10 px-2 rounded-lg border border-input bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring truncate"
            >
              <option value="">{t('allStatus')}</option>
              <option value="false">{t('active')}</option>
              <option value="true">{t('blocked')}</option>
            </select>
            <select
              value={pagination.limit}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="h-10 px-2 rounded-lg border border-input bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop: Single row layout */}
        <div className="hidden xl:flex xl:flex-row xl:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Role filter */}
          <select
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t('allRoles')}</option>
            {roles.map((role) => (
              <option key={role.id} value={role.name}>
                {role.displayName}
              </option>
            ))}
          </select>

          {/* Blocked filter */}
          <select
            value={filterBlocked}
            onChange={(e) => {
              setFilterBlocked(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t('allStatus')}</option>
            <option value="false">{t('active')}</option>
            <option value="true">{t('blocked')}</option>
          </select>

          {/* Page size selector */}
          <select
            value={pagination.limit}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-card rounded-xl border p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-card rounded-xl border p-12 text-center text-muted-foreground">
          {t('noUsers')}
        </div>
      ) : (
        <>
          {/* Desktop Table - Hidden on mobile/tablet */}
          <div className="hidden xl:block bg-card rounded-xl border">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">
                    {t('user')}
                  </th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">
                    {t('roles')}
                  </th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">
                    {t('status')}
                  </th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">
                    {t('lastLogin')}
                  </th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">
                    {t('createdAt')}
                  </th>
                  <th className="text-right text-sm font-medium text-muted-foreground px-4 py-3">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          {user.image ? (
                            <img src={user.image} alt="" className="w-10 h-10 rounded-full" />
                          ) : (
                            <UserIcon className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{user.name || '-'}</p>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length === 0 ? (
                          <span className="text-sm text-muted-foreground">{t('noRole')}</span>
                        ) : (
                          user.roles.map((role) => (
                            <span
                              key={role.id}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
                              style={{
                                backgroundColor: `${role.color}20`,
                                color: role.color,
                              }}
                            >
                              {role.isSystem && <Shield className="w-3 h-3" />}
                              {role.displayName}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.isBlocked ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <Ban className="w-3 h-3" />
                          {t('blocked')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {t('active')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        {renderUserActions(user)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Cards - Shown on smaller screens */}
          <div className="xl:hidden space-y-3">
            {users.map((user) => (
              <div key={user.id} className="bg-card rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  {/* User Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {user.image ? (
                        <img src={user.image} alt="" className="w-12 h-12 rounded-full" />
                      ) : (
                        <UserIcon className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{user.name || '-'}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  {renderUserActions(user)}
                </div>

                {/* Status & Roles */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {user.isBlocked ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      <Ban className="w-3 h-3" />
                      {t('blocked')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {t('active')}
                    </span>
                  )}
                  {user.roles.map((role) => (
                    <span
                      key={role.id}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: `${role.color}20`,
                        color: role.color,
                      }}
                    >
                      {role.isSystem && <Shield className="w-3 h-3" />}
                      {role.displayName}
                    </span>
                  ))}
                </div>

                {/* Dates */}
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{t('lastLogin')}: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{t('createdAt')}: {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Fixed Context Menu */}
      {openMenu && menuPosition && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpenMenu(null);
              setMenuPosition(null);
            }}
          />
          <div
            className="fixed w-52 bg-popover border rounded-lg shadow-xl z-50 py-1"
            style={{
              top: menuPosition.top,
              left: Math.max(8, Math.min(menuPosition.left, window.innerWidth - 216)),
            }}
          >
            {(() => {
              const user = users.find((u) => u.id === openMenu);
              if (!user) return null;
              
              // Vérifier si l'utilisateur a des actions disponibles
              const hasAnyAction = canBlock || canResetPassword || canDelete;
              
              if (!hasAnyAction) {
                return (
                  <p className="px-4 py-3 text-sm text-muted-foreground">
                    {t('noActionsAvailable')}
                  </p>
                );
              }
              
              return (
                <>
                  {/* Bloquer/Débloquer - nécessite users.block */}
                  {canBlock && (
                    user.isBlocked ? (
                      <button
                        onClick={() => handleUnblock(user)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                      >
                        <Unlock className="w-4 h-4" />
                        {t('unblock')}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBlock(user)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent text-orange-600 transition-colors"
                      >
                        <Ban className="w-4 h-4" />
                        {t('block')}
                      </button>
                    )
                  )}
                  
                  {/* Réinitialiser mot de passe - nécessite users.reset_password */}
                  {canResetPassword && (
                    <button
                      onClick={() => handleResetPassword(user)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {t('resetPassword')}
                    </button>
                  )}
                  
                  {/* Supprimer - nécessite users.delete */}
                  {canDelete && (
                    <>
                      <hr className="my-1 border-border" />
                      <button
                        onClick={() => handleDelete(user)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('delete')}
                      </button>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* Pagination */}
      <div className="bg-card rounded-xl border p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            {pagination.total > 0
              ? t('showing', {
                  from: (pagination.page - 1) * pagination.limit + 1,
                  to: Math.min(pagination.page * pagination.limit, pagination.total),
                  total: pagination.total,
                })
              : t('noUsers')}
          </p>
          
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: 1 }))}
                disabled={pagination.page === 1}
                className="p-2 text-sm rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ««
              </button>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Page numbers - simplified on mobile */}
              <div className="flex items-center gap-1">
                <span className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg">
                  {pagination.page}
                </span>
                <span className="text-sm text-muted-foreground">/ {pagination.totalPages}</span>
              </div>
              
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: pagination.totalPages }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 text-sm rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                »»
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
