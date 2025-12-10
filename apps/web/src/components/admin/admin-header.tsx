'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLocale } from '@/providers/locale-provider';
import { useAuth } from '@/hooks/use-auth';
import { Shield, Bell, User, LogOut, Menu } from 'lucide-react';

interface AdminRole {
  id: string;
  name: string;
  displayName: string;
  color: string;
  isSystem: boolean;
}

interface AdminHeaderProps {
  roles: AdminRole[];
  toggleSidebar?: () => void;
}

const languages = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export function AdminHeader({ roles, toggleSidebar }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const t = useTranslations('admin.header');
  const { locale, setLocale } = useLocale();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  // Fermer le menu quand on clique ailleurs
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
    
    // Le setLocale du provider gère cookie + DB + mise à jour UI
    setLocale(langCode as 'fr' | 'en');
  };

  const primaryRole = roles[0];

  return (
    <header className="h-16 border-b bg-card fixed top-0 left-0 right-0 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left side - Menu button + Logo */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          {toggleSidebar && (
            <button
              onClick={toggleSidebar}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-lg font-bold">ASuite</span>
              <span className="text-xs text-muted-foreground -mt-1">{t('adminPanel')}</span>
            </div>
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language selector */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="h-9 px-2 sm:px-3 rounded-lg flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={t('language')}
            >
              <span className="text-lg">{currentLang.flag}</span>
              <span className="hidden sm:inline text-sm">{currentLang.code.toUpperCase()}</span>
            </button>
            
            {langOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-card border rounded-lg shadow-lg overflow-hidden z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors ${
                      locale === lang.code ? 'bg-accent' : ''
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications placeholder */}
          <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          {/* User menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {primaryRole && (
              <span
                className="hidden sm:inline text-xs px-2 py-1 rounded-full font-medium"
                style={{
                  backgroundColor: `${primaryRole.color}20`,
                  color: primaryRole.color,
                }}
              >
                {primaryRole.displayName}
              </span>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-sm font-medium">{user?.name || user?.email}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title={t('logout')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

