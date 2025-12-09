'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Lock, ArrowRight, Loader2, Link2, AlertCircle } from 'lucide-react';

export default function PasswordProtectedPage() {
  const params = useParams();
  const code = params.code as string;
  const t = useTranslations('errors.link.protected');
  const tErrors = useTranslations('errors.link.notFound');
  const tCommon = useTranslations('common');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [linkExists, setLinkExists] = useState(true);

  useEffect(() => {
    // Vérifier que le lien existe et est bien protégé
    checkLink();
  }, [code]);

  const checkLink = async () => {
    try {
      const res = await fetch(`/api/l/${code}/check`);
      const data = await res.json();
      
      if (!res.ok || !data.passwordProtected) {
        setLinkExists(false);
      }
    } catch (err) {
      setLinkExists(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/l/${code}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        // Redirect to the original URL
        window.location.href = data.url;
      } else {
        setError(data.error || t('wrongPassword'));
      }
    } catch (err) {
      setError(tCommon('connectionError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!linkExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">{tErrors('title')}</h1>
          <p className="text-muted-foreground mb-6">
            {tErrors('description')}
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            {tErrors('backHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl border shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-xl font-bold mb-2">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('description')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">
                {t('passwordLabel')}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                required
                autoFocus
                className="w-full h-12 px-4 rounded-xl border border-input bg-background text-center text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full h-12 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('accessing')}
                </>
              ) : (
                <>
                  {t('submit')}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Powered by{' '}
          <Link href="/" className="text-primary hover:underline inline-flex items-center gap-1">
            <Link2 className="w-3 h-3" />
            ASuite ALinks
          </Link>
        </p>
      </div>
    </div>
  );
}
