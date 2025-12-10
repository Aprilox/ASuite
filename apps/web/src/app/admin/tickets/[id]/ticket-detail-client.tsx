'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useAdmin } from '@/hooks/use-admin';
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
  
  // Permissions
  const canRespond = hasPermission('tickets.respond');
  const canClose = hasPermission('tickets.close');
  const canDelete = hasPermission('tickets.delete');
  const canViewUsers = hasPermission('users.view');

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Reply state
  const [replyContent, setReplyContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages.length]);

  const fetchTicket = async () => {
    setLoading(true);
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
    } catch (error) {
      toast.error(t('loadError'));
      router.push('/admin/tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          isInternal,
        }),
      });

      if (res.ok) {
        setReplyContent('');
        setIsInternal(false);
        fetchTicket();
      } else {
        const data = await res.json();
        toast.error(data.error || t('sendError'));
      }
    } catch (error) {
      toast.error(t('sendError'));
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success(t('statusUpdated'));
        fetchTicket();
      } else {
        const data = await res.json();
        toast.error(data.error || t('updateError'));
      }
    } catch (error) {
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
    } catch (error) {
      toast.error(t('deleteError'));
    }
  };

  const statuses = ['open', 'in_progress', 'pending', 'resolved', 'closed'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) return null;

  const StatusIcon = statusIcons[ticket.status] || AlertCircle;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.push('/admin/tickets')}
          className="p-2 rounded-lg hover:bg-accent mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">#{ticket.number}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
              {t(`priority.${ticket.priority}`)}
            </span>
            <span className="text-sm text-muted-foreground">
              {t(`category.${ticket.category}`)}
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-1">{ticket.subject}</h1>
        </div>
        {/* Supprimer - nécessite tickets.delete */}
        {canDelete && (
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"
            title={t('delete')}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-xl border overflow-hidden">
            {/* Messages list */}
            <div className="max-h-[500px] overflow-y-auto p-4 space-y-4">
              {ticket.messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg ${
                    message.isInternal
                      ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900'
                      : message.author.isStaff
                      ? 'bg-primary/5 border border-primary/20'
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {message.author.name?.[0]?.toUpperCase() || message.author.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {message.author.name || message.author.email}
                        </span>
                        {message.author.isStaff && message.author.role && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
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
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            {t('internalNote')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply form - nécessite tickets.respond */}
            {canRespond && (
              <form onSubmit={handleSendReply} className="border-t p-4">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={isInternal ? t('internalNotePlaceholder') : t('replyPlaceholder')}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <div className="flex items-center justify-between mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="w-4 h-4 rounded border-input"
                    />
                    <span className="text-sm flex items-center gap-1">
                      <Lock className="w-4 h-4" />
                      {t('internalNoteLabel')}
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={sending || !replyContent.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {t('send')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-card rounded-xl border p-4">
            <h3 className="font-medium mb-3">{t('status')}</h3>
            <div className="flex items-center gap-2 mb-4">
              <StatusIcon className="w-5 h-5" />
              <span className="font-medium">{t(`status.${ticket.status}`)}</span>
            </div>
            {/* Changement de statut - nécessite tickets.close */}
            {canClose ? (
              <div className="space-y-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdateStatus(status)}
                    disabled={updating || ticket.status === status}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      ticket.status === status
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    } disabled:opacity-50`}
                  >
                    {t(`status.${status}`)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('noPermissionToChangeStatus')}</p>
            )}
          </div>

          {/* User Info */}
          <div className="bg-card rounded-xl border p-4">
            <h3 className="font-medium mb-3">{t('createdBy')}</h3>
            <div
              onClick={() => canViewUsers && router.push(`/admin/users/${ticket.user.id}`)}
              className={`flex items-center gap-3 p-2 rounded-lg ${canViewUsers ? 'hover:bg-accent cursor-pointer' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{ticket.user.name || ticket.user.email}</p>
                <p className="text-xs text-muted-foreground">{ticket.user.email}</p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-card rounded-xl border p-4">
            <h3 className="font-medium mb-3">{t('details')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('created')}</span>
                <span>{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('updated')}</span>
                <span>{new Date(ticket.updatedAt).toLocaleString()}</span>
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
  );
}

