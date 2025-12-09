'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LinkIcon, Home, Link2 } from 'lucide-react';

export default function LinkNotFoundPage() {
  const t = useTranslations('errors.link.notFound');
  const tAlinks = useTranslations('alinks');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
          <LinkIcon className="w-10 h-10 text-gray-400" />
        </div>
        
        <h1 className="text-2xl font-bold mb-3">{t('title')}</h1>
        
        <p className="text-muted-foreground mb-8">
          {t('description')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg border border-input bg-background hover:bg-accent transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            {t('backHome')}
          </Link>
          <Link
            href="/alinks"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            <Link2 className="w-4 h-4" />
            {tAlinks('createLink')}
          </Link>
        </div>

        <p className="text-xs text-muted-foreground mt-8">
          Powered by <Link href="/" className="text-primary hover:underline">ASuite</Link>
        </p>
      </div>
    </div>
  );
}
