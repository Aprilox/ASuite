'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Link2,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Settings,
  Calendar,
  Lock,
  BarChart3,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export default function ALinksPage() {
  const t = useTranslations('alinks');
  const tCommon = useTranslations('common');
  const toast = useToast();
  const [url, setUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxClicks, setMaxClicks] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    shortUrl: string;
    shortCode: string;
    qrCode?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/alinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: url,
          password: password || undefined,
          expiresAt: expiresAt || undefined,
          maxClicks: maxClicks ? parseInt(maxClicks) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || tCommon('error'));
      }

      setResult({
        shortUrl: data.shortUrl,
        shortCode: data.shortCode,
        qrCode: data.qrCode,
      });
      setUrl('');
      setPassword('');
      setExpiresAt('');
      setMaxClicks('');
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (result?.shortUrl) {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      toast.success(t('linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('description')}
          </p>
        </div>
        <Link
          href="/alinks/dashboard"
          className="inline-flex items-center gap-2 px-4 h-9 rounded-lg border border-input bg-background hover:bg-accent text-sm font-medium transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          {t('myLinks')}
        </Link>
      </div>

      {/* Form Card */}
      <div className="bg-card rounded-2xl shadow-sm border p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              {t('urlLabel')}
            </label>
            <div className="relative">
              <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t('urlPlaceholder')}
                className="w-full h-14 pl-12 pr-4 rounded-xl border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
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
                    {t('linkPassword')}
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('linkPasswordPlaceholder')}
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

                {/* Max Clicks */}
                <div className="space-y-2">
                  <label htmlFor="maxClicks" className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    {t('maxClicksLimit')}
                  </label>
                  <input
                    id="maxClicks"
                    type="number"
                    min="1"
                    value={maxClicks}
                    onChange={(e) => setMaxClicks(e.target.value)}
                    placeholder={t('unlimited')}
                    className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
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
            disabled={isLoading || !url}
            className="w-full h-12 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('creating')}
              </>
            ) : (
              <>
                <Link2 className="w-5 h-5" />
                {t('shortenButton')}
              </>
            )}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="mt-6 p-6 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-4">
              <Check className="w-5 h-5" />
              <span className="font-medium">{t('linkCreated')}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-lg bg-white dark:bg-gray-900 border">
                <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate">{result.shortUrl}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 h-12 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      {tCommon('copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {tCommon('copy')}
                    </>
                  )}
                </button>
                <Link
                  href={`/alinks/qr/${result.shortCode}`}
                  className="flex items-center justify-center w-12 h-12 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
                >
                  <QrCode className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {result.qrCode && (
              <div className="mt-4 flex justify-center">
                <img
                  src={result.qrCode}
                  alt="QR Code"
                  className="w-32 h-32 rounded-lg border bg-white p-2"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: Link2,
            titleKey: 'shortLinks',
            descKey: 'shortLinksDesc',
          },
          {
            icon: QrCode,
            titleKey: 'qrCodes',
            descKey: 'qrCodesDesc',
          },
          {
            icon: BarChart3,
            titleKey: 'statistics',
            descKey: 'statisticsDesc',
          },
        ].map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.titleKey} className="text-center p-6 bg-card rounded-xl border">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
