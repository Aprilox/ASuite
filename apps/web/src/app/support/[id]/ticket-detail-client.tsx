'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useNotifications } from '@/hooks/use-notifications';
import {
  ArrowLeft,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  XCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    userRoles?: Array<{
      role: {
        name: string;
        displayName: string;
        color: string;
      };
    }>;
  };
}

interface Ticket {
  id: string;
  number: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

const statusIcons: Record<string, React.ReactNode> = {
  open: <AlertCircle className="w-4 h-4 text-blue-500" />,
  in_progress: <Clock className="w-4 h-4 text-yellow-500" />,
  pending: <Clock className="w-4 h-4 text-orange-500" />,
  resolved: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  closed: <CheckCircle2 className="w-4 h-4 text-gray-500" />,
};

interface TicketDetailClientProps {
  id: string;
}

export function TicketDetailClient({ id }: TicketDetailClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('support');
  const toast = useToast();
  const { notifications, markAsRead } = useNotifications();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [hasShownNotFound, setHasShownNotFound] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const markedTicketsRef = useRef<Set<string>>(new Set());

  // Fetch ticket (silent = no loading state, for polling)
  const fetchTicket = useCallback(async (silent = false) => {
    if (hasShownNotFound) return; // Éviter de recharger si ticket supprimé

    try {
      const res = await fetch(`/api/tickets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTicket(data.ticket);
      } else if (res.status === 404 && !hasShownNotFound) {
        setHasShownNotFound(true);
        toast.error(t('ticketNotFound'));
        router.push('/support');
      }
    } catch (error) {
      if (!silent && !hasShownNotFound) {
        console.error('Error loading ticket:', error);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id, router, toast, t, hasShownNotFound]);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !ticket || !user) return;

    const messageContent = newMessage;

    // Clear input immediately
    setNewMessage('');
    setSending(true);

    // Optimistic update - add message immediately
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      createdAt: new Date().toISOString(),
      author: {
        id: user.id,
        name: user.name || user.email,
        image: null,
      },
    };

    setTicket(prev => prev ? {
      ...prev,
      messages: [...prev.messages, optimisticMessage],
    } : null);

    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageContent }),
      });

      if (res.ok) {
        // Refresh to get the real message
        fetchTicket(true);
      } else {
        // Revert optimistic update on error
        setTicket(prev => prev ? {
          ...prev,
          messages: prev.messages.filter(m => m.id !== optimisticMessage.id),
        } : null);
        const error = await res.json();
        toast.error(error.error || t('sendError'));
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

  const handleCloseTicket = async () => {
    if (!ticket || closing) return;

    setClosing(true);

    try {
      const res = await fetch(`/api/tickets/${id}/close`, {
        method: 'POST',
      });

      if (res.ok) {
        toast.success(t('closeSuccess'));
        setShowCloseDialog(false);
        fetchTicket(true);
      } else {
        const error = await res.json();
        toast.error(error.error || t('closeError'));
      }
    } catch {
      toast.error(t('closeError'));
    } finally {
      setClosing(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isStaff = (message: Message) => {
    return message.author.userRoles && message.author.userRoles.length > 0;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  const isClosed = ticket.status === 'closed';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Close Confirmation Dialog */}
      {showCloseDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6 border">
            <h3 className="text-lg font-semibold mb-2">{t('closeTicketConfirm')}</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {t('closeTicketDescription')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCloseDialog(false)}
                disabled={closing}
                className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              >
                {t('cancel') || 'Annuler'}
              </button>
              <button
                onClick={handleCloseTicket}
                disabled={closing}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {closing && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('closeTicket')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="border-b bg-card">
        <div className="px-6 py-4">
          <button
            onClick={() => router.push('/support')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToTickets')}
          </button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-muted-foreground">#{ticket.number}</span>
                {statusIcons[ticket.status]}
                <span className={`text-xs px-2 py-0.5 rounded-full ${ticket.status === 'open' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    ticket.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                  }`}>
                  {t(`statuses.${ticket.status}`)}
                </span>
              </div>
              <h1 className="text-xl font-bold break-words overflow-wrap-anywhere">{ticket.subject}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t(`categories.${ticket.category}`)} · {t(`priorities.${ticket.priority}`)} · {formatDate(ticket.createdAt)}
              </p>
            </div>
            {!isClosed && (
              <button
                onClick={() => setShowCloseDialog(true)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <XCircle className="w-4 h-4" />
                {t('closeTicket')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-4">
          {ticket.messages.map((message) => {
            const isOwn = message.author.id === user?.id;
            const staff = isStaff(message);

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${staff ? 'bg-primary text-primary-foreground' : 'bg-accent'
                  }`}>
                  {message.author.image ? (
                    <img
                      src={message.author.image}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>

                <div className={`flex-1 max-w-[80%] ${isOwn ? 'text-right' : ''}`}>
                  <div className={`flex items-center gap-2 mb-1 flex-wrap ${isOwn ? 'justify-end' : ''}`}>
                    <span className="font-medium text-sm">
                      {message.author.name || t('anonymous')}
                    </span>
                    {staff && message.author.userRoles?.[0] && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: message.author.userRoles[0].role.color + '20',
                          color: message.author.userRoles[0].role.color,
                        }}
                      >
                        {message.author.userRoles[0].role.displayName}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                  <div className={`inline-block p-3 rounded-xl max-w-full ${isOwn
                    ? 'bg-primary text-primary-foreground'
                    : staff
                      ? 'bg-accent border-2 border-primary/20'
                      : 'bg-accent'
                    }`}>
                    <p className="whitespace-pre-wrap text-left break-words overflow-wrap-anywhere">{message.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      {isClosed ? (
        <div className="border-t bg-card">
          <div className="px-6 py-4">
            <p className="text-center text-muted-foreground">{t('ticketClosed')}</p>
          </div>
        </div>
      ) : (
        <div className="border-t bg-card">
          <form onSubmit={handleSendMessage} className="px-6 py-4">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('replyPlaceholder')}
                className="flex-1 px-4 py-2 border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
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
        </div>
      )}
    </div>
  );
}

