'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLocale as useLocaleProvider } from '@/providers/locale-provider';
import { useAuth } from '@/hooks/use-auth';
import {
  Shield,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Users,
  Ticket,
  Settings,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

const languages = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
];

// Composant drapeau avec SVG
function FlagIcon({ code, className }: { code: string; className?: string }) {
  if (code === 'fr') {
    return (
      <svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
        <path fill="#fff" d="M0 0h640v480H0z"/>
        <path fill="#002654" d="M0 0h213.3v480H0z"/>
        <path fill="#ce1126" d="M426.7 0H640v480H426.7z"/>
      </svg>
    );
  }
  if (code === 'en') {
    return (
      <svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
        <path fill="#012169" d="M0 0h640v480H0z"/>
        <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0z"/>
        <path fill="#C8102E" d="m424 281 216 159v40L369 281zm-184 20 6 35L54 480H0zM640 0v3L391 191l2-44L590 0zM0 0l239 176h-60L0 42z"/>
        <path fill="#FFF" d="M241 0v480h160V0zM0 160v160h640V160z"/>
        <path fill="#C8102E" d="M0 193v96h640v-96zM273 0v480h96V0z"/>
      </svg>
    );
  }
  return null;
}

interface AdminRole {
  id: string;
  name: string;
  displayName: string;
  color: string;
  isSystem: boolean;
}

interface AdminLayoutClientProps {
  children: React.ReactNode;
  permissions: string[];
  roles: AdminRole[];
}

export function AdminLayoutClient({ children, permissions, roles }: AdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const t = useTranslations('admin');
  const { locale, setLocale } = useLocaleProvider();

  const currentLang = languages.find((l) => l.code === locale) || languages[0];
  const primaryRole = roles[0];

  // Fermer le menu langue quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    setLangOpen(false);
    if (langCode === locale) return;
    
    // Le setLocale du provider gère:
    // 1. Mise à jour du cookie
    // 2. Sauvegarde en DB
    // 3. Mise à jour instantanée de l'UI (sans reload)
    setLocale(langCode as 'fr' | 'en');
  };

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

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="h-14 sm:h-16 border-b bg-card fixed top-0 left-0 right-0 z-50">
        <div className="h-full px-3 sm:px-4 flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger menu - mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <Link href="/admin" className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-lg font-bold">ASuite</span>
                <span className="text-xs text-muted-foreground -mt-1">{t('header.adminPanel')}</span>
              </div>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language selector */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="h-9 px-2 sm:px-3 rounded-lg flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title={t('header.language')}
              >
                <FlagIcon code={currentLang.code} className="w-5 h-4" />
              </button>
              
              {langOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-card border rounded-lg shadow-lg overflow-hidden z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors ${
                        locale === lang.code ? 'bg-accent' : ''
                      }`}
                    >
                      <FlagIcon code={lang.code} className="w-5 h-4" />
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Bell className="w-5 h-5" />
            </button>

            {/* Role badge - hidden on very small screens */}
            {primaryRole && (
              <span
                className="hidden sm:inline-flex text-xs px-2 py-1 rounded-full font-medium"
                style={{
                  backgroundColor: `${primaryRole.color}20`,
                  color: primaryRole.color,
                }}
              >
                {primaryRole.displayName}
              </span>
            )}

            {/* User */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <button
                onClick={() => logout()}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title={t('header.logout')}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-card border-r z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:top-16 lg:h-[calc(100vh-4rem)] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile header in sidebar */}
        <div className="lg:hidden h-14 border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            <span className="font-semibold">{t('sidebar.title')}</span>
          </div>
          <button
            onClick={closeSidebar}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop header in sidebar */}
        <div className="hidden lg:block p-4 border-b">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Shield className="w-5 h-5 text-red-500" />
            <span>{t('sidebar.title')}</span>
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
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{t(`sidebar.${item.key}`)}</span>
                {active && <ChevronRight className="w-4 h-4" />}
              </Link>
            );
          })}
        </nav>

        {/* Back to site */}
        <div className="p-4 border-t">
          <Link
            href="/dashboard"
            onClick={closeSidebar}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('sidebar.backToSite')}</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="pt-14 sm:pt-16 lg:pl-64 h-screen flex flex-col">
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
