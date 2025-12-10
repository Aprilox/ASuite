'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Users,
  Ticket,
  Link2,
  Lock,
  Shield,
  TrendingUp,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react';

// Mapping des codes d'action vers des clés de traduction
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
  // Auth
  'auth.login': 'actionLogin',
  'auth.logout': 'actionLogout',
  'auth.register': 'actionRegister',
  'auth.password.change': 'actionPasswordChange',
};

interface Stats {
  users: {
    total: number;
    blocked: number;
    newToday: number;
    newThisWeek: number;
  };
  tickets: {
    total: number;
    open: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  };
  content: {
    links: number;
    vaults: number;
  };
  roles: number;
  activity: {
    loginsToday: number;
    recent: Array<{
      id: string;
      action: string;
      user: { email: string; name: string | null } | null;
      createdAt: string;
    }>;
  };
}

export default function AdminDashboard() {
  const t = useTranslations('admin.dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: t('stats.totalUsers'),
      value: stats.users.total,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      change: `+${stats.users.newThisWeek} ${t('stats.thisWeek')}`,
    },
    {
      title: t('stats.openTickets'),
      value: stats.tickets.open,
      icon: Ticket,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      change: `${stats.tickets.total} ${t('stats.total')}`,
    },
    {
      title: t('stats.totalLinks'),
      value: stats.content.links,
      icon: Link2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: t('stats.totalVaults'),
      value: stats.content.vaults,
      icon: Lock,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  const priorityColors: Record<string, string> = {
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    normal: 'bg-blue-500',
    low: 'bg-gray-400',
  };

  const statusLabels: Record<string, string> = {
    open: t('ticketStatus.open'),
    in_progress: t('ticketStatus.inProgress'),
    pending: t('ticketStatus.pending'),
    resolved: t('ticketStatus.resolved'),
    closed: t('ticketStatus.closed'),
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-card rounded-xl border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-3xl font-bold mt-1">{card.value.toLocaleString()}</p>
                  {card.change && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {card.change}
                    </p>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets par priorité */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="text-lg font-semibold mb-4">{t('ticketsByPriority')}</h2>
          <div className="space-y-3">
            {Object.entries(stats.tickets.byPriority).map(([priority, count]) => (
              <div key={priority} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${priorityColors[priority] || 'bg-gray-400'}`} />
                <span className="flex-1 text-sm capitalize">{t(`priority.${priority}`)}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
            {Object.keys(stats.tickets.byPriority).length === 0 && (
              <p className="text-sm text-muted-foreground">{t('noOpenTickets')}</p>
            )}
          </div>
        </div>

        {/* Tickets par statut */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="text-lg font-semibold mb-4">{t('ticketsByStatus')}</h2>
          <div className="space-y-3">
            {Object.entries(stats.tickets.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <span className="flex-1 text-sm">{statusLabels[status] || status}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
            {Object.keys(stats.tickets.byStatus).length === 0 && (
              <p className="text-sm text-muted-foreground">{t('noTickets')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('blockedUsers')}</p>
            <p className="text-2xl font-bold">{stats.users.blocked}</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('loginsToday')}</p>
            <p className="text-2xl font-bold">{stats.activity.loginsToday}</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('totalRoles')}</p>
            <p className="text-2xl font-bold">{stats.roles}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {stats.activity.recent.length > 0 && (
        <div className="bg-card rounded-xl border p-5">
          <h2 className="text-lg font-semibold mb-4">{t('recentActivity')}</h2>
          <div className="space-y-3">
            {stats.activity.recent.map((log) => {
              const actionKey = ACTION_TRANSLATIONS[log.action];
              const actionText = actionKey ? t(actionKey) : log.action;
              return (
                <div key={log.id} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-medium">{log.user?.email || 'Système'}</span>
                  <span className="text-muted-foreground">{actionText}</span>
                  <span className="text-muted-foreground ml-auto">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

