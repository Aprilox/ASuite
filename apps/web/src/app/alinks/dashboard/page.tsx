'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Link2,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Trash2,
  BarChart3,
  Clock,
  Lock,
  MousePointerClick,
  Plus,
  Search,
  Loader2,
  Pencil,
  X,
  Calendar,
} from 'lucide-react';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

interface LinkItem {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  title: string | null;
  clickCount: number;
  createdAt: string;
  expiresAt: string | null;
  maxClicks: number | null;
  hasPassword: boolean;
}

export default function ALinksDashboardPage() {
  const t = useTranslations('alinks');
  const tCommon = useTranslations('common');
  const confirm = useConfirm();
  const toast = useToast();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Edit modal state
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editMaxClicks, setEditMaxClicks] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [removePassword, setRemovePassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const res = await fetch('/api/alinks?limit=50');
      const data = await res.json();
      if (res.ok) {
        setLinks(data.links);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLink = async (id: string) => {
    const confirmed = await confirm({
      title: t('deleteLinkTitle'),
      message: t('deleteLinkConfirm'),
      confirmText: tCommon('delete'),
      cancelText: tCommon('cancel'),
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/alinks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLinks(links.filter((link) => link.id !== id));
        toast.success(t('linkDeleted'));
      } else {
        toast.error(tCommon('error'));
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error(tCommon('connectionError'));
    }
  };

  const copyToClipboard = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success(t('linkCopied'));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTimeLocal = (date: string | null) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  };

  const openEditModal = (link: LinkItem) => {
    setEditingLink(link);
    setEditTitle(link.title || '');
    setEditExpiresAt(formatDateTimeLocal(link.expiresAt));
    setEditMaxClicks(link.maxClicks?.toString() || '');
    setEditPassword('');
    setRemovePassword(false);
    setEditError('');
  };

  const closeEditModal = () => {
    setEditingLink(null);
    setEditTitle('');
    setEditExpiresAt('');
    setEditMaxClicks('');
    setEditPassword('');
    setRemovePassword(false);
    setEditError('');
  };

  const saveEdit = async () => {
    if (!editingLink) return;

    setIsSaving(true);
    setEditError('');

    try {
      const res = await fetch(`/api/alinks/${editingLink.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle || null,
          expiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
          maxClicks: editMaxClicks ? parseInt(editMaxClicks) : null,
          password: editPassword || undefined,
          removePassword: removePassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || tCommon('error'));
      }

      // Update link in list
      setLinks(links.map((link) => 
        link.id === editingLink.id 
          ? { 
              ...link, 
              title: editTitle || null,
              expiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
              maxClicks: editMaxClicks ? parseInt(editMaxClicks) : null,
              hasPassword: removePassword ? false : (editPassword ? true : link.hasPassword),
            }
          : link
      ));

      toast.success(t('linkUpdated'));
      closeEditModal();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredLinks = links.filter(
    (link) =>
      link.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t('myLinks')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Link
          href="/alinks"
          className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('createLink')}
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-12 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Links List */}
      <div className="bg-card rounded-xl border">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{tCommon('loading')}</p>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="p-12 text-center">
            <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? tCommon('noResults') : t('noLinks')}
            </p>
            {!searchQuery && (
              <Link
                href="/alinks"
                className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('createLink')}
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredLinks.map((link) => (
              <div key={link.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Link Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link2 className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="font-medium truncate">
                        {link.title || link.shortUrl}
                      </span>
                      {link.hasPassword && (
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    <a
                      href={link.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground truncate flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {link.originalUrl}
                    </a>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MousePointerClick className="w-4 h-4" />
                      <span>{link.clickCount} {link.clickCount === 1 ? t('click') : t('clicks')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(link.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(link.shortUrl, link.id)}
                      className="flex items-center justify-center w-9 h-9 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
                      title={tCommon('copy')}
                    >
                      {copiedId === link.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(link)}
                      className="flex items-center justify-center w-9 h-9 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
                      title={tCommon('edit')}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/alinks/qr/${link.shortCode}`}
                      className="flex items-center justify-center w-9 h-9 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
                      title={t('qrCode')}
                    >
                      <QrCode className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/alinks/stats/${link.shortCode}`}
                      className="flex items-center justify-center w-9 h-9 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
                      title={t('stats')}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => deleteLink(link.id)}
                      className="flex items-center justify-center w-9 h-9 rounded-lg border border-input bg-background hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors"
                      title={tCommon('delete')}
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

      {/* Edit Modal */}
      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={closeEditModal}
          />
          
          {/* Modal */}
          <div className="relative bg-card rounded-2xl border shadow-xl w-full max-w-md mx-4 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{t('editLink')}</h2>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Link Info */}
            <div className="p-3 rounded-lg bg-muted/50 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <Link2 className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{editingLink.shortUrl}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                → {editingLink.originalUrl}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <label htmlFor="edit-title" className="text-sm font-medium">
                  {t('title_label')}
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder={t('titlePlaceholder')}
                  className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Expiration */}
              <div className="space-y-2">
                <label htmlFor="edit-expires" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t('expirationDate')}
                </label>
                <input
                  id="edit-expires"
                  type="datetime-local"
                  value={editExpiresAt}
                  onChange={(e) => setEditExpiresAt(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {editExpiresAt && (
                  <button
                    type="button"
                    onClick={() => setEditExpiresAt('')}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t('noExpiration')}
                  </button>
                )}
              </div>

              {/* Max Clicks */}
              <div className="space-y-2">
                <label htmlFor="edit-maxclicks" className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  {t('maxClicksLimit')}
                </label>
                <input
                  id="edit-maxclicks"
                  type="number"
                  min="1"
                  value={editMaxClicks}
                  onChange={(e) => setEditMaxClicks(e.target.value)}
                  placeholder={t('unlimited')}
                  className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="edit-password" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {t('password')}
                  {editingLink?.hasPassword && !removePassword && (
                    <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                      {t('passwordProtected')}
                    </span>
                  )}
                </label>
                {editingLink?.hasPassword && !removePassword ? (
                  <div className="space-y-2">
                    <input
                      id="edit-password"
                      type="password"
                      autoComplete="off"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder={t('newPassword')}
                      className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => setRemovePassword(true)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      {t('removePassword')}
                    </button>
                  </div>
                ) : removePassword ? (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm">
                    <p className="text-red-600">{t('removePassword')}</p>
                    <button
                      type="button"
                      onClick={() => setRemovePassword(false)}
                      className="text-xs text-red-600 hover:text-red-700 underline mt-1"
                    >
                      {tCommon('cancel')}
                    </button>
                  </div>
                ) : (
                  <input
                    id="edit-password"
                    type="password"
                    autoComplete="off"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder={t('linkPasswordPlaceholder')}
                    className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
              </div>

              {/* Error */}
              {editError && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {editError}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeEditModal}
                  className="flex-1 h-10 rounded-lg border border-input bg-background hover:bg-accent font-medium transition-colors"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 h-10 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {tCommon('loading')}
                    </>
                  ) : (
                    t('saveChanges')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
