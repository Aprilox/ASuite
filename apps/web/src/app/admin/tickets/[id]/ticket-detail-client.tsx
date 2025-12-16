'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useAdmin } from '@/hooks/use-admin';
import { useNotifications } from '@/hooks/use-notifications';
import {
  ArrowLeft,
  Loader2,
  Send,
  Lock,
  User as UserIcon,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Trash2,
  Shield,
  Settings2,
  X,
} from 'lucide-react';

interface TicketAuthor {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  isStaff: boolean;
  role: {
    name: string;
    displayName: string;
    color: string;
  } | null;
}

interface TicketMessage {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  author: TicketAuthor;
}

interface TicketUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: string;
}

interface TicketDetail {
  id: string;
  number: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  user: TicketUser;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

const statusIcons: Record<string, typeof Clock> = {
  open: AlertCircle,
  in_progress: Clock,
  pending: Pause,
  resolved: CheckCircle,
  closed: XCircle,
};

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

interface TicketDetailClientProps {
  id: string;
}

export function TicketDetailClient({ id }: TicketDetailClientProps) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const t = useTranslations('admin.tickets');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { hasPermission } = useAdmin();
  const { notifications, markAsRead } = useNotifications();
  const markedTicketsRef = useRef<Set<string>>(new Set());

  // Permissions
  const canRespond = hasPermission('tickets.respond');
  const canClose = hasPermission('tickets.close');
  const canDelete = hasPermission('tickets.delete');
  const canViewUsers = hasPermission('users.view');

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reply state
  const [replyContent, setReplyContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch ticket (silent = no loading state, for polling)
  const fetchTicket = useCallback(async (silent = false) => {
    if (isDeleting) return; // Ne pas recharger si en cours de suppression
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/admin/tickets/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/admin/tickets');
          return;
        }
        throw new Error('Erreur');
      }
      const data = await res.json();
      setTicket(data.ticket);
    } catch {
      if (!silent) {
        toast.error(t('loadError'));
        router.push('/admin/tickets');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id, router, t, toast, isDeleting]);

  // Initial fetch
  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  // Mark notifications as read when opening this ticket
  useEffect(() => {
    const unreadNotifications = notifications.filter(
      n => n.ticketId === id && !n.read
    );

    // Mark all unread notifications for this ticket as read
    unreadNotifications.forEach(notification => {
      markAsRead(notification.id);
    });
  }, [id, notifications, markAsRead]);

  // Polling for new messages (every 5 seconds, only if ticket is not closed)
  useEffect(() => {
    if (ticket?.status === 'closed') return;

    const interval = setInterval(() => {
      fetchTicket(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchTicket, ticket?.status]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages.length]);

  // Refocus input after sending is complete
  const prevSendingRef = useRef(sending);
  useEffect(() => {
    if (prevSendingRef.current && !sending) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
    prevSendingRef.current = sending;
  }, [sending]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !ticket) return;

    const messageContent = replyContent;
    const messageIsInternal = isInternal;

    // Clear input immediately
    setReplyContent('');
    setIsInternal(false);
    setSending(true);

    // Optimistic update - add message immediately
    const optimisticMessage: TicketMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      isInternal: messageIsInternal,
      createdAt: new Date().toISOString(),
      author: {
        id: 'current',
        email: '',
        name: 'Vous',
        image: null,
        isStaff: true,
        role: null,
      },
    };

    setTicket(prev => prev ? {
      ...prev,
      messages: [...prev.messages, optimisticMessage],
    } : null);

    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent,
          isInternal: messageIsInternal,
        }),
      });

      if (res.ok) {
        // Refresh to get the real message with correct data
        fetchTicket(true);
      } else {
        // Revert optimistic update on error
        setTicket(prev => prev ? {
          ...prev,
          messages: prev.messages.filter(m => m.id !== optimisticMessage.id),
        } : null);
        const data = await res.json();
        toast.error(data.error || t('sendError'));
      }
    } catch {
      // Revert optimistic update on error
      setTicket(prev => prev ? {
        ...prev,
        messages: prev.messages.filter(m => m.id !== optimisticMessage.id),
      } : null);
      toast.error(t('sendError'));
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!ticket) return;

    const previousStatus = ticket.status;

    // Optimistic update
    setTicket(prev => prev ? { ...prev, status } : null);
    setUpdating(true);

    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success(t('statusUpdated'));
      } else {
        // Revert on error
        setTicket(prev => prev ? { ...prev, status: previousStatus } : null);
        const data = await res.json();
        toast.error(data.error || t('updateError'));
      }
    } catch {
      // Revert on error
      setTicket(prev => prev ? { ...prev, status: previousStatus } : null);
      toast.error(t('updateError'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t('deleteTicket'),
      message: t('deleteConfirm'),
      confirmText: t('delete'),
      cancelText: t('cancel'),
      variant: 'danger',
    });

    if (!confirmed) return;

    setIsDeleting(true); // Empêcher les rechargements pendant la suppression

    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success(t('deleteSuccess'));
        router.push('/admin/tickets');
      } else {
        toast.error(t('deleteError'));
      }
    } catch {
      toast.error(t('deleteError'));
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statuses = ['open', 'in_progress', 'pending', 'resolved', 'closed'];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) return null;

  const StatusIcon = statusIcons[ticket.status] || AlertCircle;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-card px-6 py-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push('/admin/tickets')}
            className="p-2 rounded-lg hover:bg-accent -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm text-muted-foreground">#{ticket.number}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusColors[ticket.status]}`}>
                <StatusIcon className="w-3 h-3" />
                {t(`status.${ticket.status}`)}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
                {t(`priority.${ticket.priority}`)}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent">
                {t(`category.${ticket.category}`)}
              </span>
            </div>
            <h1 className="text-xl font-bold break-words overflow-wrap-anywhere">{ticket.subject}</h1>
          </div>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"
              title={t('delete')}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-accent lg:hidden"
            title="Options"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {ticket.messages.map((message) => {
                // Message du client (créateur du ticket) = gauche, Staff = droite
                const isTicketOwner = message.author.id === ticket.user.id;
                const isStaff = message.author.isStaff;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${!isTicketOwner ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium ${isStaff ? 'bg-primary text-primary-foreground' : 'bg-accent'
                      }`}>
                      {message.author.name?.[0]?.toUpperCase() || message.author.email[0].toUpperCase()}
                    </div>

                    <div className={`max-w-[75%] ${!isTicketOwner ? 'text-right' : ''}`}>
                      <div className={`flex items-center gap-2 mb-1 flex-wrap ${!isTicketOwner ? 'justify-end' : ''}`}>
                        <span className="font-medium text-sm">
                          {message.author.name || message.author.email}
                        </span>
                        {isStaff && message.author.role && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
                            style={{
                              backgroundColor: `${message.author.role.color}20`,
                              color: message.author.role.color,
                            }}
                          >
                            <Shield className="w-3 h-3" />
                            {message.author.role.displayName}
                          </span>
                        )}
                        {message.isInternal && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            {t('internalNote')}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <div className={`inline-block p-3 rounded-2xl text-left max-w-full ${message.isInternal
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800'
                        : isStaff
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent'
                        }`}>
                        <p className="whitespace-pre-wrap text-sm break-words overflow-wrap-anywhere">{message.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Reply Form */}
          {canRespond && (
            <div className="flex-shrink-0 border-t bg-card p-4">
              <form onSubmit={handleSendReply}>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={isInternal ? t('internalNotePlaceholder') : t('replyPlaceholder')}
                      className={`w-full px-4 py-2.5 rounded-xl border-2 bg-background transition-all duration-200 ${isInternal
                        ? 'border-amber-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                        : 'border-primary/30 focus:ring-2 focus:ring-primary/50 focus:border-primary shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                        }`}
                      disabled={sending}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending || !replyContent.trim()}
                    className={`px-4 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2 ${isInternal
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isInternal ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {t('send')}
                  </button>
                </div>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="w-4 h-4 rounded border-input"
                  />
                  <span className="text-sm flex items-center gap-1 text-muted-foreground">
                    <Lock className="w-3.5 h-3.5" />
                    {t('internalNoteLabel')}
                  </span>
                </label>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className={`fixed top-0 right-0 h-full w-80 bg-card border-l z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto lg:relative lg:translate-x-0 lg:z-auto ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
          {/* Mobile close button */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b">
            <span className="font-semibold">Options</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-accent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            {/* Status */}
            <div className="bg-muted/50 rounded-xl p-4">
              <h3 className="font-medium mb-3 text-sm">Statut</h3>
              {canClose ? (
                <div className="grid grid-cols-1 gap-1.5">
                  {statuses.map((status) => {
                    const Icon = statusIcons[status];
                    return (
                      <button
                        key={status}
                        onClick={() => {
                          handleUpdateStatus(status);
                          setSidebarOpen(false);
                        }}
                        disabled={updating || ticket.status === status}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${ticket.status === status
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                          } disabled:opacity-50`}
                      >
                        <Icon className="w-4 h-4" />
                        {t(`status.${status}`)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <StatusIcon className="w-4 h-4" />
                  <span className="text-sm">{t(`status.${ticket.status}`)}</span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="bg-muted/50 rounded-xl p-4">
              <h3 className="font-medium mb-3 text-sm">{t('createdBy')}</h3>
              <div
                onClick={() => {
                  if (canViewUsers) {
                    router.push(`/admin/users/${ticket.user.id}`);
                  }
                }}
                className={`flex items-center gap-3 p-2 rounded-lg -mx-2 ${canViewUsers ? 'hover:bg-accent cursor-pointer' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{ticket.user.name || ticket.user.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{ticket.user.email}</p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-muted/50 rounded-xl p-4">
              <h3 className="font-medium mb-3 text-sm">{t('details')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('created')}</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('updated')}</span>
                  <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('messages')}</span>
                  <span>{ticket.messages.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
