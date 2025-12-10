'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Lock,
  Plus,
  Eye,
  Calendar,
  Flame,
  Trash2,
  Copy,
  Loader2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface VaultNote {
  id: string;
  code: string;
  title: string | null;
  encryptionKey: string | null;
  hasPassword: boolean;
  expiresAt: string | null;
  burnAfterRead: boolean;
  maxViews: number | null;
  viewCount: number;
  createdAt: string;
  isExpired: boolean;
}

export default function AVaultDashboardPage() {
  const t = useTranslations('avault');
  const tCommon = useTranslations('common');
  const toast = useToast();
  const confirm = useConfirm();
  
  const [notes, setNotes] = useState<VaultNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/vault');
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      setError(tCommon('error'));
      console.error('Error fetching notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNote = async (code: string) => {
    const confirmed = await confirm({
      title: t('deleteNoteTitle'),
      message: t('deleteNoteConfirm'),
      confirmText: tCommon('delete'),
      cancelText: tCommon('cancel'),
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/vault/${code}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete note');
      
      setNotes(notes.filter(n => n.code !== code));
      toast.success(t('noteDeleted'));
    } catch (err) {
      toast.error(tCommon('error'));
      console.error('Error deleting note:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyLink = async (note: VaultNote) => {
    if (!note.encryptionKey) {
      toast.error(t('keyNotAvailable'));
      return;
    }
    const link = `${baseUrl}/v/${note.code}#${note.encryptionKey}`;
    await navigator.clipboard.writeText(link);
    toast.success(t('noteCopied'));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            {t('myNotes')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </p>
        </div>
        <Link
          href="/avault"
          className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('newNote')}
        </Link>
      </div>

      {/* Info - E2E encryption */}
      <div className="p-4 rounded-lg bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
        <div className="text-sm text-purple-800 dark:text-purple-200 flex items-start gap-1.5">
          <Copy className="w-3 h-3 shrink-0 mt-0.5" />
          <span>{t('dashboardInfo')}</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive mb-6">
          {error}
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="bg-card rounded-2xl border p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('noNotes')}</h3>
          <p className="text-muted-foreground mb-6">{t('noNotesDesc')}</p>
          <Link
            href="/avault"
            className="inline-flex items-center gap-2 px-6 h-11 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('createNote')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`bg-card rounded-xl border p-5 ${
                note.isExpired ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold truncate">
                      {note.title || t('encryptedNote')}
                    </h3>
                    {note.isExpired && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                        Expiré
                      </span>
                    )}
                    {note.hasPassword && (
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {t('passwordProtected')}
                      </span>
                    )}
                    {note.burnAfterRead && (
                      <span className="text-xs px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        {t('burnAfterRead')}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {note.viewCount} {note.viewCount === 1 ? t('view') : t('views')}
                      {note.maxViews && ` / ${note.maxViews}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(note.createdAt)}
                    </span>
                    {note.expiresAt && (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {t('expires')}: {formatDate(note.expiresAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyLink(note)}
                    disabled={!note.encryptionKey}
                    className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={note.encryptionKey ? t('copyLink') : t('keyNotAvailableOld')}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteNote(note.code)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                    title={t('deleteNote')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
