'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';

const tools = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    status: 'active' as const,
  },
  {
    name: 'ALinks',
    icon: Link2,
    href: '/alinks',
    status: 'active' as const,
  },
  {
    name: 'AVault',
    icon: Lock,
    href: '/avault',
    status: 'coming' as const,
  },
  {
    name: 'ATransfer',
    icon: Send,
    href: '/atransfer',
    status: 'coming' as const,
  },
  {
    name: 'ACalendar',
    icon: Calendar,
    href: '/acalendar',
    status: 'coming' as const,
  },
  {
    name: 'AMail',
    icon: Mail,
    href: '/amail',
    status: 'coming' as const,
  },
  {
    name: 'ADrive',
    icon: HardDrive,
    href: '/adrive',
    status: 'coming' as const,
  },
  {
    name: 'AMeet',
    icon: Video,
    href: '/ameet',
    status: 'coming' as const,
  },
  {
    name: 'ADocs',
    icon: FileText,
    href: '/adocs',
    status: 'coming' as const,
  },
  {
    name: 'ASheets',
    icon: Table,
    href: '/asheets',
    status: 'coming' as const,
  },
  {
    name: 'ASlides',
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

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`hidden lg:flex flex-col border-r bg-card h-[calc(100vh-4rem)] sticky top-0 transition-all ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const active = isActive(tool.href);
          const disabled = tool.status === 'coming';

          return (
            <Link
              key={tool.name}
              href={disabled ? '#' : tool.href}
              onClick={(e) => disabled && e.preventDefault()}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : disabled
                  ? 'text-muted-foreground/50 cursor-not-allowed'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? tool.name : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{tool.name}</span>
                  {disabled && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      Bientôt
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="p-4 border-t">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Paramètres' : undefined}
        >
          <Settings className="w-5 h-5" />
          {!collapsed && <span>Paramètres</span>}
        </Link>
      </div>
    </aside>
  );
}

