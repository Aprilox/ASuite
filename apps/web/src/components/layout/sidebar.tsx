'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAdmin } from '@/hooks/use-admin';
import { useNotifications } from '@/hooks/use-notifications';
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
  LayoutDashboard,
  Settings,
  Shield,
  MessageSquare,
} from 'lucide-react';

const tools = [
  {
    key: 'dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    status: 'active' as const,
  },
  {
    key: 'alinks',
    icon: Link2,
    href: '/alinks',
    status: 'active' as const,
  },
  {
    key: 'avault',
    icon: Lock,
    href: '/avault',
    status: 'active' as const,
  },
  {
    key: 'atransfer',
    icon: Send,
    href: '/atransfer',
    status: 'coming' as const,
  },
  {
    key: 'acalendar',
    icon: Calendar,
    href: '/acalendar',
    status: 'coming' as const,
  },
  {
    key: 'amail',
    icon: Mail,
    href: '/amail',
    status: 'coming' as const,
  },
  {
    key: 'adrive',
    icon: HardDrive,
    href: '/adrive',
    status: 'coming' as const,
  },
  {
    key: 'ameet',
    icon: Video,
    href: '/ameet',
    status: 'coming' as const,
  },
  {
    key: 'adocs',
    icon: FileText,
    href: '/adocs',
    status: 'coming' as const,
  },
  {
    key: 'asheets',
    icon: Table,
    href: '/asheets',
    status: 'coming' as const,
  },
  {
    key: 'aslides',
    icon: Presentation,
    href: '/aslides',
    status: 'coming' as const,
  },
];

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('sidebar');
  const tTools = useTranslations('tools');
  const tCommon = useTranslations('common');
  const { isAdmin } = useAdmin();
  const { unreadCount } = useNotifications();

  console.log('[Sidebar] unreadCount:', unreadCount);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const getToolName = (key: string) => {
    if (key === 'dashboard') return t('dashboard');
    return tTools(`${key}.name`);
  };

  return (
    <aside
      className={`hidden lg:flex flex-col border-r bg-card h-[calc(100vh-4rem)] sticky top-16 flex-shrink-0 transition-all ${collapsed ? 'w-16' : 'w-64'
        }`}
    >
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const active = isActive(tool.href);
          const disabled = tool.status === 'coming';
          const toolName = getToolName(tool.key);

          return (
            <Link
              key={tool.key}
              href={disabled ? '#' : tool.href}
              onClick={(e) => disabled && e.preventDefault()}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active
                ? 'bg-primary text-primary-foreground'
                : disabled
                  ? 'text-muted-foreground/50 cursor-not-allowed'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? toolName : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{toolName}</span>
                  {disabled && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {tCommon('comingSoon')}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Support, Admin & Settings */}
      <div className="p-4 border-t space-y-1">
        {/* Support */}
        <Link
          href="/support"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith('/support')
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? t('support') : undefined}
        >
          <MessageSquare className="w-5 h-5" />
          {!collapsed && (
            <>
              <span className="flex-1">{t('support')}</span>
              {unreadCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-white text-xs font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </>
          )}
        </Link>

        {/* Admin Panel Link */}
        {isAdmin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors ${collapsed ? 'justify-center' : ''
              }`}
            title={collapsed ? t('adminPanel') : undefined}
          >
            <Shield className="w-5 h-5" />
            {!collapsed && <span>{t('adminPanel')}</span>}
          </Link>
        )}

        {/* Settings */}
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${collapsed ? 'justify-center' : ''
            }`}
          title={collapsed ? t('settings') : undefined}
        >
          <Settings className="w-5 h-5" />
          {!collapsed && <span>{t('settings')}</span>}
        </Link>
      </div>
    </aside>
  );
}
