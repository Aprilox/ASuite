'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';
import { useNotifications } from '@/hooks/use-notifications';
import {
  Search,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
} from 'lucide-react';

interface TicketUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

interface Ticket {
  id: string;
  number: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  user: TicketUser;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

const statusIcons: Record<string, typeof Clock> = {
  open: AlertCircle,
  in_progress: Clock,
  pending: Pause,
  resolved: CheckCircle,
  closed: XCircle,
};

const statusColors: Record<string, string> = {
  open: 'text-blue-500',
  in_progress: 'text-orange-500',
  pending: 'text-yellow-500',
  resolved: 'text-green-500',
  closed: 'text-gray-500',
};

interface SavedFilters {
  status: string;
  priority: string;
  category: string;
}

export default function AdminTicketsPage() {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('admin.tickets');
  const { notifications } = useNotifications();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterUnread, setFilterUnread] = useState(''); // '' = all, 'unread' = non vues
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

  // Auto-refresh tickets when new ticket notification arrives
  useEffect(() => {
    if (!filtersLoaded || notifications.length === 0) return;

    const latestNotification = notifications[0]; // Les notifications sont triées par date décroissante

    // Vérifier si c'est une nouvelle notification liée aux tickets
    if (
      latestNotification.id !== lastNotificationId &&
      lastNotificationId !== null &&
      (latestNotification.type === 'ticket_new' ||
        latestNotification.type === 'ticket_response_client')
    ) {
      console.log('[Admin Tickets] New ticket notification, refreshing list...');
      // Nouvelle notification de ticket, rafraîchir la liste
      const refetchTickets = async () => {
        try {
          const params = new URLSearchParams({
            page: pagination.page.toString(),
            limit: pagination.limit.toString(),
          });
          if (search) params.set('search', search);
          if (filterStatus) params.set('status', filterStatus);
          if (filterPriority) params.set('priority', filterPriority);
          if (filterCategory) params.set('category', filterCategory);

          const res = await fetch(`/api/admin/tickets?${params}`);
          if (res.ok) {
            const data = await res.json();
            setTickets(data.tickets);
            setPagination(data.pagination);
          }
        } catch (error) {
          console.error('Error refetching tickets:', error);
        }
      };
      refetchTickets();
    }

    if (latestNotification) {
      setLastNotificationId(latestNotification.id);
    }
  }, [notifications, filtersLoaded, pagination.page, pagination.limit, search, filterStatus, filterPriority, filterCategory]);

  // Load saved filters from database on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const res = await fetch('/api/admin/preferences');
        if (res.ok) {
          const data = await res.json();
          const filters = data.preferences?.ticketFilters as SavedFilters | undefined;
          if (filters) {
            setFilterStatus(filters.status || '');
            setFilterPriority(filters.priority || '');
            setFilterCategory(filters.category || '');
          }
        }
      } catch {
        // Ignore errors, use defaults
      }
      setFiltersLoaded(true);
    };
    loadFilters();
  }, []);

  // Save filters to database when they change (debounced)
  useEffect(() => {
    if (!filtersLoaded) return;

    const saveFilters = async () => {
      try {
        await fetch('/api/admin/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'ticketFilters',
            value: {
              status: filterStatus,
              priority: filterPriority,
              category: filterCategory,
            },
          }),
        });
      } catch {
        // Ignore save errors
      }
    };

    // Debounce to avoid too many requests
    const timeout = setTimeout(saveFilters, 500);
    return () => clearTimeout(timeout);
  }, [filterStatus, filterPriority, filterCategory, filtersLoaded]);

  useEffect(() => {
    if (!filtersLoaded) return;
    fetchTickets();
  }, [pagination.page, search, filterStatus, filterPriority, filterCategory, filtersLoaded]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterPriority) params.set('priority', filterPriority);
      if (filterCategory) params.set('category', filterCategory);

      const res = await fetch(`/api/admin/tickets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets);
        setPagination(data.pagination);
      }
    } catch (error) {
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const statuses = ['open', 'in_progress', 'pending', 'resolved', 'closed'];
  const priorities = ['urgent', 'high', 'normal', 'low'];
  const categories = ['bug', 'question', 'feature', 'other'];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t('allStatuses')}</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t('allPriorities')}</option>
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {t(`priority.${priority}`)}
              </option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t('allCategories')}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {t(`category.${category}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-card rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('noTickets')}
          </div>
        ) : (
          <div className="divide-y">
            {tickets.map((ticket) => {
              const StatusIcon = statusIcons[ticket.status] || AlertCircle;
              const hasUnreadNotifications = notifications.some(
                (n: any) => n.ticketId === ticket.id && !n.read
              );

              return (
                <button
                  key={ticket.id}
                  onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
                  className="w-full p-4 hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <StatusIcon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm text-muted-foreground">#{ticket.number}</span>
                        {hasUnreadNotifications && (
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
                          {t(`priority.${ticket.priority}`)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t(`category.${ticket.category}`)}
                        </span>
                      </div>
                      <h3 className="font-medium line-clamp-2 break-words overflow-wrap-anywhere">{ticket.subject}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {ticket.user.name || ticket.user.email} · {new Date(ticket.createdAt).toLocaleDateString()} · {ticket.messageCount} message(s)
                      </p>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${ticket.status === 'open' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          ticket.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                            ticket.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>
                        {t(`status.${ticket.status}`)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              {t('showing', {
                from: (pagination.page - 1) * pagination.limit + 1,
                to: Math.min(pagination.page * pagination.limit, pagination.total),
                total: pagination.total,
              })}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




