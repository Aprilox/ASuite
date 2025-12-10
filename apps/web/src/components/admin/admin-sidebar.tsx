'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Users,
  Shield,
  Ticket,
  Settings,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';

interface AdminSidebarProps {
  permissions: string[];
}

export function AdminSidebar({ permissions }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('admin.sidebar');

  const hasPermission = (perm: string) => permissions.includes(perm);

  const menuItems = [
    {
      key: 'dashboard',
      icon: LayoutDashboard,
      href: '/admin',
      permission: 'admin.dashboard',
      exact: true,
    },
    {
      key: 'users',
      icon: Users,
      href: '/admin/users',
      permission: 'users.view',
    },
    {
      key: 'roles',
      icon: Shield,
      href: '/admin/roles',
      permission: 'roles.view',
    },
    {
      key: 'tickets',
      icon: Ticket,
      href: '/admin/tickets',
      permission: 'tickets.view',
    },
    {
      key: 'settings',
      icon: Settings,
      href: '/admin/settings',
      permission: 'settings.view',
    },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-card border-r h-[calc(100vh-4rem)] sticky top-16 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Shield className="w-5 h-5 text-red-500" />
          <span>{t('title')}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          if (!hasPermission(item.permission)) return null;

          const Icon = item.icon;
          const active = isActive(item.href, item.exact);

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{t(item.key)}</span>
              {active && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer - Retour au site */}
      <div className="p-4 border-t">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('backToSite')}</span>
        </Link>
      </div>
    </aside>
  );
}

