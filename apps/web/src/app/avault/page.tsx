'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Lock,
  Copy,
  Check,
  Settings,
  Calendar,
  Eye,
  Flame,
  Shield,
  Share2,
  BarChart3,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

// Utilitaires de chiffrement côté client
async function generateKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

async function encryptContent(content: string, key: CryptoKey): Promise<{ encrypted: string; iv: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

export default function AVaultPage() {
  const t = useTranslations('avault');
  const tCommon = useTranslations('common');
  const toast = useToast();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [maxViews, setMaxViews] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    code: string;
    shareUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      // Générer une clé de chiffrement
      const key = await generateKey();
      const keyString = await exportKey(key);
      
      // Chiffrer le contenu
      const { encrypted, iv } = await encryptContent(content, key);
      
      // Envoyer au serveur (inclut la clé pour les utilisateurs connectés)
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || null,
          content: encrypted,
          iv,
          encryptionKey: keyString, // Stocké uniquement si connecté
          password: password || undefined,
          expiresAt: expiresAt || undefined,
          burnAfterRead,
          maxViews: maxViews ? parseInt(maxViews) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || tCommon('error'));
      }

      // L'URL de partage inclut la clé de déchiffrement dans le fragment (non envoyé au serveur)
      const shareUrl = `${baseUrl}/v/${data.code}#${keyString}`;
      
      setResult({
        code: data.code,
        shareUrl,
      });
      
      // Reset form
      setTitle('');
      setContent('');
      setPassword('');
      setExpiresAt('');
      setBurnAfterRead(false);
      setMaxViews('');
      
      toast.success(t('noteCreated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (result?.shareUrl) {
      await navigator.clipboard.writeText(result.shareUrl);
      setCopied(true);
      toast.success(t('noteCopied'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('description')}
          </p>
        </div>
        <Link
          href="/avault/dashboard"
          className="inline-flex items-center gap-2 px-4 h-9 rounded-lg border border-input bg-background hover:bg-accent text-sm font-medium transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          {t('myNotes')}
        </Link>
      </div>

      {/* Form Card */}
      <div className="bg-card rounded-2xl shadow-sm border p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title Input */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              {t('titleLabel')}
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('titlePlaceholder')}
              className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Content Textarea */}
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              {t('contentLabel')} <span className="text-destructive">*</span>
            </label>
            <textarea
              id="content"
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('contentPlaceholder')}
              rows={10}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono"
            />
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
            {t('advancedOptions')}
            <span className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    {t('password')}
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="off"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('passwordPlaceholder')}
                    className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Expiration */}
                <div className="space-y-2">
                  <label htmlFor="expiresAt" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t('expirationDate')}
                  </label>
                  <input
                    id="expiresAt"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Max Views */}
                <div className="space-y-2">
                  <label htmlFor="maxViews" className="text-sm font-medium flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    {t('maxViews')}
                  </label>
                  <input
                    id="maxViews"
                    type="number"
                    min="1"
                    value={maxViews}
                    onChange={(e) => setMaxViews(e.target.value)}
                    placeholder="∞"
                    className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Burn After Read */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Flame className="w-4 h-4" />
                    {t('burnAfterRead')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setBurnAfterRead(!burnAfterRead)}
                    className={`w-full min-h-10 py-2 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 text-center ${
                      burnAfterRead
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-background border-input hover:bg-accent'
                    }`}
                  >
                    <Flame className="w-4 h-4 shrink-0" />
                    <span>{burnAfterRead ? t('burnAfterRead') : t('burnAfterReadDesc')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !content}
            className="w-full h-12 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('encrypting')}
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                {t('encrypt')}
              </>
            )}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="mt-6 p-6 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 mb-4">
              <Check className="w-5 h-5" />
              <span className="font-medium">{t('noteCreated')}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-lg bg-white dark:bg-gray-900 border overflow-hidden">
                <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate">{result.shareUrl}</span>
              </div>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 h-12 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    {tCommon('copied')}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {t('copyLink')}
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              {t('keyWarning')}
            </p>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: Shield,
            titleKey: 'encryption',
            descKey: 'encryptionDesc',
          },
          {
            icon: Share2,
            titleKey: 'sharing',
            descKey: 'sharingDesc',
          },
          {
            icon: Flame,
            titleKey: 'burn',
            descKey: 'burnDesc',
          },
        ].map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.titleKey} className="text-center p-6 bg-card rounded-xl border">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2">{t(`features.${feature.titleKey}`)}</h3>
              <p className="text-sm text-muted-foreground">{t(`features.${feature.descKey}`)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
