'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLocale as useLocaleProvider } from '@/providers/locale-provider';
import { useAuth } from '@/hooks/use-auth';
import { useAdmin } from '@/hooks/use-admin';
import {
    User,
    LogOut,
    Menu,
    X,
    LayoutDashboard,
    Settings,
    Shield,
    MessageSquare,
    ChevronRight,
    ChevronDown, // Added ChevronDown for user dropdown
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
                <path fill="#fff" d="M0 0h640v480H0z" />
                <path fill="#002654" d="M0 0h213.3v480H0z" />
                <path fill="#ce1126" d="M426.7 0H640v480H426.7z" />
            </svg>
        );
    }
    if (code === 'en') {
        return (
            <svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
                <path fill="#012169" d="M0 0h640v480H0z" />
                <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0z" />
                <path fill="#C8102E" d="m424 281 216 159v40L369 281zm-184 20 6 35L54 480H0zM640 0v3L391 191l2-44L590 0zM0 0l239 176h-60L0 42z" />
                <path fill="#FFF" d="M241 0v480h160V0zM0 160v160h640V160z" />
                <path fill="#C8102E" d="M0 193v96h640v-96zM273 0v480h96V0z" />
            </svg>
        );
    }
    return null;
}

const tools = [
    { key: 'dashboard', icon: LayoutDashboard, href: '/dashboard', status: 'active' as const },
    { key: 'alinks', icon: Link2, href: '/alinks', status: 'active' as const },
    { key: 'avault', icon: Lock, href: '/avault', status: 'active' as const },
    { key: 'atransfer', icon: Send, href: '/atransfer', status: 'coming' as const },
    { key: 'acalendar', icon: Calendar, href: '/acalendar', status: 'coming' as const },
    { key: 'amail', icon: Mail, href: '/amail', status: 'coming' as const },
    { key: 'adrive', icon: HardDrive, href: '/adrive', status: 'coming' as const },
    { key: 'ameet', icon: Video, href: '/ameet', status: 'coming' as const },
    { key: 'adocs', icon: FileText, href: '/adocs', status: 'coming' as const },
    { key: 'asheets', icon: Table, href: '/asheets', status: 'coming' as const },
    { key: 'aslides', icon: Presentation, href: '/aslides', status: 'coming' as const },
];

interface DashboardLayoutClientProps {
    children: React.ReactNode;
}

export function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);
    const userRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { isAdmin } = useAdmin();
    const t = useTranslations('sidebar');
    const tTools = useTranslations('tools');
    const tCommon = useTranslations('common');
    const { locale, setLocale } = useLocaleProvider();

    const currentLang = languages.find((l) => l.code === locale) || languages[0];

    // Fermer les menus quand on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(event.target as Node)) {
                setLangOpen(false);
            }
            if (userRef.current && !userRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageChange = (langCode: string) => {
        setLangOpen(false);
        if (langCode === locale) return;
        setLocale(langCode as 'fr' | 'en');
    };

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

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Header */}
            <header className="h-14 sm:h-16 border-b bg-card fixed top-0 left-0 right-0 z-50">
                <div className="h-full px-3 sm:px-4 flex items-center justify-between">
                    {/* Left side */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Hamburger menu - visible below lg */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">A</span>
                            </div>
                            <span className="text-lg font-bold">ASuite</span>
                        </Link>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Language selector */}
                        <div ref={langRef} className="relative">
                            <button
                                onClick={() => setLangOpen(!langOpen)}
                                className="h-9 px-2 sm:px-3 rounded-lg flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                title="Language"
                            >
                                <FlagIcon code={currentLang.code} className="w-5 h-4" />
                            </button>

                            {langOpen && (
                                <div className="absolute right-0 mt-2 w-40 bg-card border rounded-lg shadow-lg overflow-hidden z-50">
                                    {languages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => handleLanguageChange(lang.code)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors ${locale === lang.code ? 'bg-accent' : ''
                                                }`}
                                        >
                                            <FlagIcon code={lang.code} className="w-5 h-4" />
                                            <span>{lang.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* User Menu */}
                        <div ref={userRef} className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 px-3 h-9 rounded-lg hover:bg-accent transition-colors"
                            >
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="w-4 h-4 text-primary" />
                                </div>
                                <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                                    {user?.name || user?.email.split('@')[0]}
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
                                            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                        </div>
                                        <Link
                                            href="/dashboard"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            Dashboard
                                        </Link>
                                        <Link
                                            href="/settings"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Settings
                                        </Link>
                                        <div className="border-t my-1" />
                                        <button
                                            onClick={() => {
                                                setUserMenuOpen(false);
                                                logout();
                                            }}
                                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors w-full text-left text-red-600"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Logout
                                        </button>
                                    </div>
                                </>
                            )}
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
                className={`fixed top-0 left-0 h-full w-64 bg-card border-r z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:top-16 lg:h-[calc(100vh-4rem)] flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Mobile header in sidebar */}
                <div className="lg:hidden h-14 border-b flex items-center justify-between px-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">A</span>
                        </div>
                        <span className="font-semibold">ASuite</span>
                    </div>
                    <button
                        onClick={closeSidebar}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
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
                                onClick={(e) => {
                                    if (disabled) {
                                        e.preventDefault();
                                    } else {
                                        closeSidebar();
                                    }
                                }}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                                    ? 'bg-primary text-primary-foreground'
                                    : disabled
                                        ? 'text-muted-foreground/50 cursor-not-allowed'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                    }`}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <span className="flex-1">{toolName}</span>
                                {disabled && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                        {tCommon('comingSoon')}
                                    </span>
                                )}
                                {active && <ChevronRight className="w-4 h-4" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer - Support, Admin & Settings */}
                <div className="p-4 border-t space-y-1 flex-shrink-0">
                    {/* Support */}
                    <Link
                        href="/support"
                        onClick={closeSidebar}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith('/support')
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            }`}
                    >
                        <MessageSquare className="w-5 h-5" />
                        <span>{t('support')}</span>
                    </Link>

                    {/* Admin Panel Link */}
                    {isAdmin && (
                        <Link
                            href="/admin"
                            onClick={closeSidebar}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                            <Shield className="w-5 h-5" />
                            <span>{t('adminPanel')}</span>
                        </Link>
                    )}

                    {/* Settings */}
                    <Link
                        href="/settings"
                        onClick={closeSidebar}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith('/settings')
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            }`}
                    >
                        <Settings className="w-5 h-5" />
                        <span>{t('settings')}</span>
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <main className="pt-14 sm:pt-16 lg:pl-64 h-screen flex flex-col">
                <div className="flex-1 flex flex-col overflow-auto p-4 sm:p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
