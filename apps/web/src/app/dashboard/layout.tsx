'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayoutClient } from '@/app/dashboard/layout-client';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isLoading, isAuthenticated, user } = useAuth();
    const tCommon = useTranslations('common');

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login?redirect=/dashboard');
            }
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">{tCommon('loading')}</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
