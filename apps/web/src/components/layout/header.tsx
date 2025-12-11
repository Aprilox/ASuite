'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useLocale } from '@/providers/locale-provider';
import { FlagIcon } from '@/components/ui/flag-icon';
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Settings,
  Link2,
  Lock,
  MessageSquare,
  Shield,
  Send,
  Calendar,
  Mail,
  HardDrive,
  Video,
  FileText,
  Table,
  Presentation,
} from 'lucide-react';
import { useAdmin } from '@/hooks/use-admin';

interface HeaderProps {
  variant?: 'default' | 'transparent';
}

export function Header({ variant = 'default' }: HeaderProps) {
  const t = useTranslations('header');
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { locale, setLocale, locales, localeNames } = useLocale();
  const { isAdmin } = useAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const tSidebar = useTranslations('sidebar');
  const tTools = useTranslations('tools');
  const tCommon = useTranslations('common');
  
  // Sidebar links for mobile
  const sidebarLinks = [
    { href: '/dashboard', icon: LayoutDashboard, label: tSidebar('dashboard'), coming: false },
    { href: '/alinks', icon: Link2, label: tTools('alinks.name'), coming: false },
    { href: '/avault', icon: Lock, label: tTools('avault.name'), coming: false },
    { href: '/atransfer', icon: Send, label: tTools('atransfer.name'), coming: true },
    { href: '/acalendar', icon: Calendar, label: tTools('acalendar.name'), coming: true },
    { href: '/amail', icon: Mail, label: tTools('amail.name'), coming: true },
    { href: '/adrive', icon: HardDrive, label: tTools('adrive.name'), coming: true },
    { href: '/ameet', icon: Video, label: tTools('ameet.name'), coming: true },
    { href: '/adocs', icon: FileText, label: tTools('adocs.name'), coming: true },
    { href: '/asheets', icon: Table, label: tTools('asheets.name'), coming: true },
    { href: '/aslides', icon: Presentation, label: tTools('aslides.name'), coming: true },
    { href: '/support', icon: MessageSquare, label: tSidebar('support'), coming: false },
  ];
  
  const isDashboardPage = pathname.startsWith('/dashboard') || 
    pathname.startsWith('/alinks') || 
    pathname.startsWith('/avault') || 
    pathname.startsWith('/support') ||
    pathname.startsWith('/settings');

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const navLinks = [
    { href: '/#tools', label: t('tools') },
    { href: '/#features', label: t('features') },
  ];

  const isHomePage = pathname === '/';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-colors ${
        variant === 'transparent'
          ? 'bg-background/80 backdrop-blur-sm'
          : 'bg-background'
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center">
        {/* Logo - Left */}
        <div className="flex-1 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="font-bold text-xl">ASuite</span>
          </Link>
        </div>

        {/* Desktop Navigation - Center */}
        <nav className="hidden md:flex items-center justify-center gap-6">
          {isHomePage &&
            navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
        </nav>

        {/* Desktop Auth - Right */}
        <div className="flex-1 hidden md:flex items-center justify-end gap-3">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-2 px-2 h-9 rounded-lg hover:bg-accent transition-colors text-sm"
            >
              <FlagIcon locale={locale} className="w-5 h-4 shadow-sm" />
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
            {langMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-40 bg-popover border rounded-lg shadow-lg py-1 z-50">
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setLangMenuOpen(false);
                        setLocale(loc);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors w-full text-left ${
                        locale === loc ? 'bg-accent font-medium' : ''
                      }`}
                    >
                      <FlagIcon locale={loc} className="w-5 h-4 shadow-sm" />
                      <span>{localeNames[loc]}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {isLoading ? (
            <div className="w-20 h-9 bg-muted animate-pulse rounded-md" />
          ) : isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 h-9 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium max-w-[120px] truncate">
                  {user.name || user.email.split('@')[0]}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-popover border rounded-lg shadow-lg py-1 z-50">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium truncate">{user.name || t('user')}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {t('dashboard')}
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      {t('settings')}
                    </Link>
                    <div className="border-t my-1" />
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors w-full text-left text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {t('register')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {isHomePage && (
              <nav className="space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}

            {/* Sidebar links for dashboard pages */}
            {isDashboardPage && isAuthenticated && (
              <nav className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                  Navigation
                </p>
                {sidebarLinks.map((link) => {
                  const Icon = link.icon;
                  const isActivePath = link.href === '/dashboard' 
                    ? pathname === '/dashboard'
                    : pathname.startsWith(link.href);
                  
                  if (link.coming) {
                    return (
                      <div
                        key={link.href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
                      >
                        <Icon className="w-5 h-5" />
                        <span className="flex-1">{link.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {tCommon('comingSoon')}
                        </span>
                      </div>
                    );
                  }
                  
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActivePath
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {link.label}
                    </Link>
                  );
                })}

                <div className="pt-3 mt-3 border-t space-y-1">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Shield className="w-5 h-5" />
                      {tSidebar('adminPanel')}
                    </Link>
                  )}
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/settings')
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                    {tSidebar('settings')}
                  </Link>
                </div>
              </nav>
            )}

            {/* User section */}
            <div className="pt-4 mt-4 border-t space-y-3">
              {isLoading ? (
                <div className="w-full h-10 bg-muted animate-pulse rounded-md" />
              ) : isAuthenticated && user ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{user.name || t('user')}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    {/* Language Switcher */}
                    <div className="flex gap-1">
                      {locales.map((loc) => (
                        <button
                          key={loc}
                          onClick={() => setLocale(loc)}
                          className={`p-1.5 rounded-md transition-colors ${
                            locale === loc ? 'bg-primary' : 'bg-muted hover:bg-accent'
                          }`}
                        >
                          <FlagIcon locale={loc} className="w-5 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Only show Dashboard/Settings links if NOT on dashboard pages (to avoid duplicates) */}
                  {!isDashboardPage && (
                    <div className="space-y-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        {t('dashboard')}
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
                      >
                        <Settings className="w-5 h-5" />
                        {t('settings')}
                      </Link>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 w-full transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    {t('logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-2 rounded-md border hover:bg-accent transition-colors"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    {t('register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
