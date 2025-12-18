'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { LanguageSelector } from '@/components/ui/language-selector';

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const t = useTranslations('verify');

    // safe getters
    const verified = searchParams?.get('verified') === 'true';
    const error = searchParams?.get('error');
    const token = searchParams?.get('token');

    // Handle legacy links (token in URL) by redirecting to API
    useEffect(() => {
        if (token) {
            window.location.href = `/api/auth/verify-email/confirm?token=${token}`;
        }
    }, [token]);

    // If we have a token, show loading state while redirecting
    if (token) {
        return (
            <div className="flex flex-col items-center justify-center p-8 animate-in fade-in">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <h2 className="text-xl font-semibold text-slate-800 dark:text-foreground">{t('loadingTitle')}</h2>
                <p className="text-slate-500 dark:text-muted-foreground text-sm mt-2">{t('loadingSubtitle')}</p>
            </div>
        );
    }

    if (verified) {
        return (
            <div className="text-center animate-in fade-in zoom-in duration-300">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-foreground mb-2">{t('successTitle')}</h1>
                <p className="text-slate-600 dark:text-muted-foreground mb-8">
                    {t('successMessage')}
                </p>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                    {t('goToDashboard')}
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    if (error) {
        let errorMessage = t('defaultError');
        if (error === 'invalid_token') errorMessage = t('invalidToken');
        if (error === 'missing_token') errorMessage = t('missingToken');
        if (error === 'server_error') errorMessage = t('serverError');

        // Pour too_many_attempts, afficher le temps restant
        if (error === 'too_many_attempts') {
            const retrySeconds = parseInt(searchParams?.get('retry') || '900', 10);
            const minutes = Math.floor(retrySeconds / 60);
            const seconds = retrySeconds % 60;

            if (minutes > 0) {
                errorMessage = `${t('tooManyAttempts')} Réessayez dans ${minutes} min ${seconds > 0 ? `${seconds} sec` : ''}.`;
            } else {
                errorMessage = `${t('tooManyAttempts')} Réessayez dans ${seconds} secondes.`;
            }
        }

        return (
            <div className="text-center animate-in fade-in zoom-in duration-300">
                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                    <XCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-foreground mb-2">{t('errorTitle')}</h1>
                <p className="text-slate-600 dark:text-muted-foreground mb-8 max-w-xs mx-auto">
                    {errorMessage}
                </p>
                <Link
                    href="/verify-email"
                    className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-accent dark:hover:bg-accent/80 dark:text-foreground text-white font-semibold px-6 py-3 rounded-lg transition-all"
                >
                    {t('newLinkButton')}
                </Link>
            </div>
        );
    }

    // Default state
    return (
        <div className="text-center animate-in fade-in zoom-in duration-300">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-foreground mb-2">{t('defaultTitle')}</h1>
            <p className="text-slate-600 dark:text-muted-foreground mb-8">
                {t('defaultMessage')}
            </p>
            <Link
                href="/login"
                className="text-blue-600 hover:underline font-medium dark:text-blue-400"
            >
                {t('backToLogin')}
            </Link>
        </div>
    );
}

export default function VerifyResultPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration issues by only rendering after mount
    if (!mounted) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-card dark:border dark:border-border rounded-2xl shadow-xl overflow-hidden p-8 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center p-4 relative transition-colors duration-300">
            <div className="absolute top-4 right-4">
                <LanguageSelector variant="compact" />
            </div>
            <div className="max-w-md w-full bg-white dark:bg-card dark:border dark:border-border rounded-2xl shadow-xl overflow-hidden p-8 transition-colors duration-300">
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                        <p className="text-slate-600 dark:text-muted-foreground font-medium">Chargement...</p>
                    </div>
                }>
                    <VerifyContent />
                </Suspense>
            </div>
        </div>
    );
}
