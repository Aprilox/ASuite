'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
  MessageSquare, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight,
  X
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Ticket {
  id: string;
  number: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
}

const statusIcons: Record<string, React.ReactNode> = {
  open: <AlertCircle className="w-4 h-4 text-blue-500" />,
  in_progress: <Clock className="w-4 h-4 text-yellow-500" />,
  pending: <Clock className="w-4 h-4 text-orange-500" />,
  resolved: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  closed: <CheckCircle2 className="w-4 h-4 text-gray-500" />,
};

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function SupportPage() {
  const router = useRouter();
  const t = useTranslations('support');
  const tCommon = useTranslations('common');
  const toast = useToast();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('question');
  const [priority, setPriority] = useState('normal');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, category, priority, message }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(t('ticketCreated'));
        setShowNewTicket(false);
        setSubject('');
        setCategory('question');
        setPriority('normal');
        setMessage('');
        router.push(`/support/${data.ticket.id}`);
      } else {
        const error = await res.json();
        toast.error(error.error || t('createError'));
      }
    } catch {
      toast.error(t('createError'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              {t('title')}
            </h1>
            <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
          </div>
          <button
            onClick={() => setShowNewTicket(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('newTicket')}
          </button>
        </div>

        {/* New Ticket Modal */}
        {showNewTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">{t('newTicket')}</h2>
                <button
                  onClick={() => setShowNewTicket(false)}
                  className="p-1 hover:bg-accent rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('subject')}</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t('subjectPlaceholder')}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    minLength={5}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('category')}</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="question">{t('categories.question')}</option>
                      <option value="bug">{t('categories.bug')}</option>
                      <option value="feature">{t('categories.feature')}</option>
                      <option value="other">{t('categories.other')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">{t('priority')}</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="low">{t('priorities.low')}</option>
                      <option value="normal">{t('priorities.normal')}</option>
                      <option value="high">{t('priorities.high')}</option>
                      <option value="urgent">{t('priorities.urgent')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('message')}</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('messagePlaceholder')}
                    rows={5}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    required
                    minLength={10}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTicket(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
                  >
                    {tCommon('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('submit')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="text-center py-16 bg-card border rounded-xl">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('noTickets')}</h3>
            <p className="text-muted-foreground mb-6">{t('noTicketsDesc')}</p>
            <button
              onClick={() => setShowNewTicket(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('createFirst')}
            </button>
          </div>
        ) : (
          <div className="bg-card border rounded-xl overflow-hidden">
            <div className="divide-y">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => router.push(`/support/${ticket.id}`)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex-shrink-0">
                    {statusIcons[ticket.status]}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">#{ticket.number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[ticket.priority]}`}>
                        {t(`priorities.${ticket.priority}`)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent">
                        {t(`categories.${ticket.category}`)}
                      </span>
                    </div>
                    <h3 className="font-medium truncate">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(ticket.createdAt)} · {ticket._count.messages} {t('messages')}
                    </p>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      ticket.status === 'open' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      ticket.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {t(`statuses.${ticket.status}`)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

