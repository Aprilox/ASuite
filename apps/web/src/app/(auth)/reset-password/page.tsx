'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Lock, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { LanguageSelector } from '@/components/ui/language-selector';
import { checkPasswordStrength } from '@asuite/utils';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const t = useTranslations('resetPassword');
    const tAuth = useTranslations('auth');
    const tFooter = useTranslations('footer');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Verify token on mount
    useEffect(() => {
        if (!token) {
            setVerifying(false);
            setTokenValid(false);
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await fetch(`/api/auth/reset-password?token=${token}`);
                const data = await res.json();
                setTokenValid(data.valid);
            } catch {
                setTokenValid(false);
            } finally {
                setVerifying(false);
            }
        };

        verifyToken();
    }, [token]);

    const passwordStrength = checkPasswordStrength(password);
    const passwordsMatch = password && confirmPassword && password === confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!passwordsMatch || passwordStrength.score < 3) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password, confirmPassword }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setError(data.error || t('error'));
            }
        } catch {
            setError(t('error'));
        } finally {
            setLoading(false);
        }
    };

    const getStrengthColor = (score: number) => {
        if (score < 2) return 'bg-red-500';
        if (score < 3) return 'bg-amber-500';
        return 'bg-green-500';
    };

    const getStrengthLabel = (score: number) => {
        if (score < 2) return tAuth('passwordStrength.weak');
        if (score < 3) return tAuth('passwordStrength.medium');
        return tAuth('passwordStrength.strong');
    };

    // Loading state
    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

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
                    {!tokenValid ? (
                        // Invalid token state
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>

                            <h1 className="text-2xl font-bold mb-2">{t('invalidTitle')}</h1>

                            <p className="text-muted-foreground mb-6">
                                {t('invalidDescription')}
                            </p>

                            <Link
                                href="/forgot-password"
                                className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                            >
                                {t('requestNew')}
                            </Link>

                            <div className="mt-4">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    {t('backToLogin')}
                                </Link>
                            </div>
                        </div>
                    ) : success ? (
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
                                className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                            >
                                {t('goToLogin')}
                            </Link>
                        </div>
                    ) : (
                        // Form state
                        <div>
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                                    <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>

                                <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
                                <p className="text-muted-foreground">{t('subtitle')}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* New password */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium mb-2">
                                        {t('newPassword')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className="w-full h-12 px-4 pr-12 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    {/* Password strength indicator */}
                                    {password && (
                                        <div className="mt-2 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all ${getStrengthColor(passwordStrength.score)}`}
                                                        style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium">{getStrengthLabel(passwordStrength.score)}</span>
                                            </div>
                                            <ul className="text-xs space-y-1 text-muted-foreground">
                                                <li className={password.length >= 8 ? 'text-green-600' : ''}>
                                                    ✓ {tAuth('passwordStrength.minLength')}
                                                </li>
                                                <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                                                    ✓ {tAuth('passwordStrength.uppercase')}
                                                </li>
                                                <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                                                    ✓ {tAuth('passwordStrength.lowercase')}
                                                </li>
                                                <li className={/\d/.test(password) ? 'text-green-600' : ''}>
                                                    ✓ {tAuth('passwordStrength.number')}
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm password */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                                        {t('confirmPassword')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className={`w-full h-12 px-4 pr-12 rounded-lg border bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${confirmPassword && !passwordsMatch
                                                ? 'border-red-500'
                                                : confirmPassword && passwordsMatch
                                                    ? 'border-green-500'
                                                    : 'border-slate-200 dark:border-slate-600'
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {confirmPassword && (
                                        <p className={`text-xs mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                                            {passwordsMatch ? t('passwordsMatch') : t('passwordsDontMatch')}
                                        </p>
                                    )}
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !passwordsMatch || passwordStrength.score < 3}
                                    className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {t('resetting')}
                                        </>
                                    ) : (
                                        t('resetButton')
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
