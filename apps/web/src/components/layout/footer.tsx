'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Link2,
  Lock,
  Send,
  Calendar,
  Mail,
  HardDrive,
  Github,
} from 'lucide-react';

const toolLinks = [
  { key: 'alinks', href: '/alinks', icon: Link2, available: true },
  { key: 'avault', href: '/avault', icon: Lock, available: true },
  { key: 'atransfer', href: '/coming-soon?tool=atransfer', icon: Send, available: false },
  { key: 'acalendar', href: '/coming-soon?tool=acalendar', icon: Calendar, available: false },
  { key: 'amail', href: '/coming-soon?tool=amail', icon: Mail, available: false },
  { key: 'adrive', href: '/coming-soon?tool=adrive', icon: HardDrive, available: false },
];

export function Footer() {
  const t = useTranslations('footer');
  const tTools = useTranslations('tools');
  const tCommon = useTranslations('common');

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="font-bold text-xl">ASuite</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              {t('madeWith')} ❤️ {t('forProductivity')}
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/Aprilox/ASuite"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h4 className="font-semibold mb-4">{t('tools')}</h4>
            <ul className="space-y-2">
              {toolLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <link.icon className="w-4 h-4" />
                    {tTools(`${link.key}.name`)}
                    {!link.available && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {tCommon('comingSoon')}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">{t('resources')}</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/coming-soon?tool=docs"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('documentation')}
                </Link>
              </li>
              <li>
                <Link
                  href="/coming-soon?tool=support"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('support')}
                </Link>
              </li>
              <li>
                <Link
                  href="/changelog"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('changelog')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">{t('legal')}</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/legal"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('legal')}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('cookies')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ASuite. {t('allRightsReserved')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('madeWith')} ❤️ {t('forProductivity')}
          </p>
        </div>
      </div>
    </footer>
  );
}
