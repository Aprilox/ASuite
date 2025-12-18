'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Mail, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { LanguageSelector } from '@/components/ui/language-selector';

import { useAuth } from '@/hooks/use-auth';

export default function VerifyEmailPage() {
    const router = useRouter();
    const t = useTranslations('verifyEmail');
    const toast = useToast();
    const { refresh, logout, isAuthenticated, user, isLoading } = useAuth();
    const [sending, setSending] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [sent, setSent] = useState(false);
    const hasAutoSent = useRef(false);

    // Vérifier l'authentification et le statut de vérification
    useEffect(() => {
        if (isLoading) return;

        // Si pas connecté, rediriger vers login
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Si déjà vérifié, rediriger vers dashboard
        if (user?.emailVerified) {
            router.push('/dashboard');
            return;
        }
    }, [isAuthenticated, user, isLoading, router]);

    useEffect(() => {
        // Envoi automatique de l'email une seule fois au chargement
        const autoSend = async () => {
            if (hasAutoSent.current) return;
            hasAutoSent.current = true;

            // On attend un court instant pour que l'UI soit prête
            await new Promise(r => setTimeout(r, 500));

            handleResend();
        };

        autoSend();
    }, []);

    const handleResend = async () => {
        if (sending) return;
        setSending(true);
        try {
            const res = await fetch('/api/auth/verify-email/request', {
                method: 'POST',
            });

            const data = await res.json();

            if (res.ok) {
                setSent(true);
                toast.success(t('successMessage'));

                // Remettre le bouton en mode disponible après 3 secondes
                setTimeout(() => {
                    setSent(false);
                }, 3000);
            } else {
                if (data.message === 'Email déjà vérifié') {
                    toast.success(t('alreadyVerified'));
                    await refresh();
                    router.push('/dashboard');
                } else {
                    toast.error(data.error || t('errorSending'));
                }
            }
        } catch (error) {
            toast.error(t('errorSending'));
        } finally {
            setSending(false);
        }
    };

    const handleLogout = async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        await logout();
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center p-4 relative transition-colors duration-300">
            <div className="absolute top-4 right-4">
                <LanguageSelector variant="compact" />
            </div>
            <div className="max-w-md w-full bg-white dark:bg-card dark:border dark:border-border rounded-2xl shadow-xl overflow-hidden transition-colors duration-300">
                <div className="bg-blue-600 dark:bg-blue-700 p-6 text-center">
                    <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mb-4">
                        <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
                    <p className="text-blue-100 mt-2">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="p-8">
                    <div className="space-y-6">
                        <div className="text-center text-slate-600 dark:text-muted-foreground">
                            <p>
                                {t('sentMessage')}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-muted-foreground/60 mt-4">
                                {t('spamNote')}
                            </p>
                        </div>

                        {sent ? (
                            <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-medium">{t('successMessage')}</p>
                            </div>
                        ) : null}

                        <div className="space-y-3 pt-2">
                            <button
                                onClick={handleResend}
                                disabled={sending || sent}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold h-11 rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {sending ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        {t('sending')}
                                    </>
                                ) : sent ? (
                                    t('sent')
                                ) : (
                                    t('resendButton')
                                )}
                            </button>

                            <button
                                onClick={async () => {
                                    try {
                                        const res = await fetch('/api/auth/me');
                                        const user = await res.json();

                                        if (user?.emailVerified) {
                                            toast.success(t('checkSuccess'));
                                            // Vital: Sync local state with server state before redirecting
                                            await refresh();
                                            router.push('/dashboard');
                                        } else {
                                            toast.error(t('checkError'));
                                        }
                                    } catch (e) {
                                        toast.error(t('errorSending'));
                                    }
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-accent dark:hover:bg-accent/80 text-slate-700 dark:text-foreground font-medium h-11 rounded-lg transition-all"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {t('iHaveVerified')}
                            </button>

                            <button
                                onClick={handleLogout}
                                disabled={loggingOut}
                                className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 dark:text-muted-foreground dark:hover:text-foreground font-medium h-11 hover:bg-slate-50 dark:hover:bg-accent rounded-lg transition-all disabled:opacity-70"
                            >
                                {loggingOut ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <LogOut className="w-4 h-4" />
                                )}
                                {t('logout')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
