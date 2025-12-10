'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import {
  Link2,
  Lock,
  Send,
  Calendar,
  Mail,
  HardDrive,
  Video,
  FileText,
  Table,
  Presentation,
  Loader2,
} from 'lucide-react';

const toolKeys = [
  { key: 'alinks', icon: Link2, color: 'bg-blue-500', href: '/alinks', status: 'active' },
  { key: 'avault', icon: Lock, color: 'bg-violet-500', href: '/avault', status: 'active' },
  { key: 'atransfer', icon: Send, color: 'bg-emerald-500', href: '/atransfer', status: 'coming' },
  { key: 'acalendar', icon: Calendar, color: 'bg-amber-500', href: '/acalendar', status: 'coming' },
  { key: 'amail', icon: Mail, color: 'bg-red-500', href: '/amail', status: 'coming' },
  { key: 'adrive', icon: HardDrive, color: 'bg-cyan-500', href: '/adrive', status: 'coming' },
  { key: 'ameet', icon: Video, color: 'bg-pink-500', href: '/ameet', status: 'coming' },
  { key: 'adocs', icon: FileText, color: 'bg-indigo-500', href: '/adocs', status: 'coming' },
  { key: 'asheets', icon: Table, color: 'bg-green-500', href: '/asheets', status: 'coming' },
  { key: 'aslides', icon: Presentation, color: 'bg-orange-500', href: '/aslides', status: 'coming' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const t = useTranslations('dashboard');
  const tTools = useTranslations('tools');
  const tCommon = useTranslations('common');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard');
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

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <div className="flex pt-16 h-[calc(100vh-4rem)]">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">
              {t('welcome')}{user.name ? `, ${user.name}` : ''} !
            </h1>
            <p className="text-muted-foreground">
              {t('welcomeMessage')}
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {toolKeys.map((tool) => {
              const Icon = tool.icon;
              const isActive = tool.status === 'active';

              return (
                <Link
                  key={tool.key}
                  href={isActive ? tool.href : '#'}
                  className={`group relative p-6 rounded-xl border bg-card hover:shadow-lg transition-all duration-300 ${
                    !isActive ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-1'
                  }`}
                  onClick={(e) => !isActive && e.preventDefault()}
                >
                  {!isActive && (
                    <span className="absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {tCommon('comingSoon')}
                    </span>
                  )}
                  <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{tTools(`${tool.key}.name`)}</h3>
                  <p className="text-sm text-muted-foreground">{tTools(`${tool.key}.description`)}</p>
                </Link>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="mt-12">
            <h2 className="text-lg font-semibold mb-4">{t('recentActivity')}</h2>
            <div className="bg-card rounded-xl border p-8 text-center">
              <p className="text-muted-foreground">
                {t('startMessage')}
              </p>
              <Link
                href="/alinks"
                className="inline-flex items-center gap-2 mt-4 px-4 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Link2 className="w-4 h-4" />
                {t('createShortLink')}
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
