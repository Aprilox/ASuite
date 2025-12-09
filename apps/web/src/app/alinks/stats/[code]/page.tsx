'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Link2,
  ArrowLeft,
  MousePointerClick,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';

interface LinkStats {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  title: string | null;
  clickCount: number;
  createdAt: string;
  analytics: {
    totalClicks: number;
    clicksByDevice: { device: string; count: number }[];
    clicksByBrowser: { browser: string; count: number }[];
    recentClicks: {
      id: string;
      device: string;
      browser: string;
      os: string;
      referer: string | null;
      createdAt: string;
    }[];
  };
}

export default function LinkStatsPage() {
  const params = useParams();
  const code = params.code as string;
  const t = useTranslations('alinks');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors.link');
  const [stats, setStats] = useState<LinkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [code]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/alinks/by-code/${code}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || tCommon('error'));
      }

      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (stats?.shortUrl) {
      await navigator.clipboard.writeText(stats.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      default:
        return Monitor;
    }
  };

  const getDeviceName = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return t('statsPage.mobile');
      case 'tablet':
        return t('statsPage.tablet');
      case 'desktop':
        return t('statsPage.desktop');
      default:
        return t('statsPage.unknown');
    }
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

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || tErrors('notFound.title')}</p>
          <Link
            href="/alinks/dashboard"
            className="text-primary hover:underline"
          >
            {t('statsPage.backToLinks')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/alinks/dashboard"
          className="flex items-center justify-center w-10 h-10 rounded-lg border hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Link2 className="w-6 h-6 text-blue-500" />
            {stats.title || stats.shortCode}
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-sm text-muted-foreground">{stats.shortUrl}</span>
            <button
              onClick={copyToClipboard}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? tCommon('copied') : tCommon('copy')}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-2">
            <MousePointerClick className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">{t('statsPage.totalClicks')}</span>
          </div>
          <p className="text-3xl font-bold">{stats.clickCount}</p>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">{t('created')}</span>
          </div>
          <p className="text-lg font-medium">{formatDate(stats.createdAt)}</p>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-2">
            <ExternalLink className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">{t('originalUrl')}</span>
          </div>
          <a
            href={stats.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline truncate block"
          >
            {stats.originalUrl}
          </a>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* By Device */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="font-semibold mb-4">{t('statsPage.deviceBreakdown')}</h3>
          {stats.analytics.clicksByDevice.length > 0 ? (
            <div className="space-y-3">
              {stats.analytics.clicksByDevice.map((item) => {
                const Icon = getDeviceIcon(item.device);
                const percentage = Math.round(
                  (item.count / stats.clickCount) * 100
                );
                return (
                  <div key={item.device}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{getDeviceName(item.device)}</span>
                      </div>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('statsPage.noData')}</p>
          )}
        </div>

        {/* By Browser */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="font-semibold mb-4">{t('statsPage.browserBreakdown')}</h3>
          {stats.analytics.clicksByBrowser.length > 0 ? (
            <div className="space-y-3">
              {stats.analytics.clicksByBrowser.map((item) => {
                const percentage = Math.round(
                  (item.count / stats.clickCount) * 100
                );
                return (
                  <div key={item.browser}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{item.browser}</span>
                      </div>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('statsPage.noData')}</p>
          )}
        </div>
      </div>

      {/* Recent Clicks */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="font-semibold mb-4">{t('statsPage.recentClicks')}</h3>
        {stats.analytics.recentClicks.length > 0 ? (
          <div className="space-y-3">
            {stats.analytics.recentClicks.map((click) => {
              const Icon = getDeviceIcon(click.device);
              return (
                <div
                  key={click.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm">
                        {click.browser} / {click.os}
                      </p>
                      {click.referer && (
                        <p className="text-xs text-muted-foreground truncate">
                          {click.referer}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(click.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <MousePointerClick className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {t('statsPage.noData')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
