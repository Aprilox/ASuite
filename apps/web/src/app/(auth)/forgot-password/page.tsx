'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';
import { LanguageSelector } from '@/components/ui/language-selector';

export default function ForgotPasswordPage() {
  const t = useTranslations('forgotPassword');
  const tFooter = useTranslations('footer');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || t('error'));
      }
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 relative">
      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector variant="compact" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="font-bold text-2xl">ASuite</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
          {success ? (
            // Success state
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>

              <h1 className="text-2xl font-bold mb-2">{t('successTitle')}</h1>

              <p className="text-muted-foreground mb-6">
                {t('successDescription')}
              </p>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('backToLogin')}
              </Link>
            </div>
          ) : (
            // Form state
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>

                <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    {t('emailLabel')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    required
                    className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('sending')}
                    </>
                  ) : (
                    t('sendButton')
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('backToLogin')}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          © {new Date().getFullYear()} ASuite. {tFooter('allRightsReserved')}
        </p>
      </div>
    </div>
  );
}
