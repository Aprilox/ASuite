import Link from 'next/link';
import {
  Link2,
  Lock,
  Send,
  Calendar,
  Mail,
  HardDrive,
  Github,
  Twitter,
} from 'lucide-react';

const toolLinks = [
  { name: 'ALinks', href: '/alinks', icon: Link2, available: true },
  { name: 'AVault', href: '/coming-soon?tool=avault', icon: Lock, available: false },
  { name: 'ATransfer', href: '/coming-soon?tool=atransfer', icon: Send, available: false },
  { name: 'ACalendar', href: '/coming-soon?tool=acalendar', icon: Calendar, available: false },
  { name: 'AMail', href: '/coming-soon?tool=amail', icon: Mail, available: false },
  { name: 'ADrive', href: '/coming-soon?tool=adrive', icon: HardDrive, available: false },
];

const legalLinks = [
  { name: 'Mentions légales', href: '/coming-soon?tool=legal' },
  { name: 'Confidentialité', href: '/coming-soon?tool=privacy' },
  { name: 'CGU', href: '/coming-soon?tool=terms' },
];

export function Footer() {
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
              Suite collaborative professionnelle pour communiquer, partager et donner vie à vos idées en sécurité.
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
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h4 className="font-semibold mb-4">Outils</h4>
            <ul className="space-y-2">
              {toolLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                    {!link.available && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Bientôt
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h4 className="font-semibold mb-4">Ressources</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/coming-soon?tool=docs"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/coming-soon?tool=support"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Support
                </Link>
              </li>
              <li>
                <Link
                  href="/coming-soon?tool=changelog"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Changelog
                </Link>
              </li>
              <li>
                <Link
                  href="/coming-soon?tool=status"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Statut des services
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Légal</h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ASuite. Tous droits réservés.
          </p>
          <p className="text-sm text-muted-foreground">
            Fait avec ❤️ pour la productivité
          </p>
        </div>
      </div>
    </footer>
  );
}
