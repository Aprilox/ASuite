'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Header, Footer } from '@/components/layout';
import { 
  ArrowLeft, 
  History, 
  Sparkles, 
  Shield, 
  Check, 
  Palette,
  Link2,
  QrCode,
  BarChart3,
  Lock,
  Bell,
  Settings,
  Globe,
  Rocket,
  Tag,
  Loader2,
  Bug
} from 'lucide-react';

interface ChangeEntry {
  type: 'feature' | 'security' | 'fix' | 'improvement';
  text: string;
}

interface VersionEntry {
  version: string;
  date: string;
  changes: ChangeEntry[];
}

// Mapping de mots-clés vers des icônes
const getIconForText = (text: string) => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('langue') || lowerText.includes('language') || lowerText.includes('multi-langue')) return Globe;
  if (lowerText.includes('thème') || lowerText.includes('theme') || lowerText.includes('apparence')) return Palette;
  if (lowerText.includes('lien') || lowerText.includes('link') || lowerText.includes('alinks')) return Link2;
  if (lowerText.includes('qr')) return QrCode;
  if (lowerText.includes('statistique') || lowerText.includes('stats')) return BarChart3;
  if (lowerText.includes('mot de passe') || lowerText.includes('password') || lowerText.includes('authentification') || lowerText.includes('session')) return Lock;
  if (lowerText.includes('notification')) return Bell;
  if (lowerText.includes('paramètre') || lowerText.includes('setting') || lowerText.includes('dashboard')) return Settings;
  if (lowerText.includes('coming soon') || lowerText.includes('bientôt')) return Rocket;
  if (lowerText.includes('sécurit') || lowerText.includes('security') || lowerText.includes('header') || lowerText.includes('csp') || lowerText.includes('brute')) return Shield;
  if (lowerText.includes('bug') || lowerText.includes('fix') || lowerText.includes('correction')) return Bug;
  return Sparkles;
};

export default function ChangelogPage() {
  const t = useTranslations('changelog');
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/changelog')
      .then((res) => res.json())
      .then((data) => {
        setVersions(data.versions || []);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'security':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'fix':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'improvement':
        return 'bg-violet-500/10 text-violet-500 border-violet-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'feature':
        return t('feature');
      case 'security':
        return t('security');
      case 'fix':
        return t('fix');
      case 'improvement':
        return t('improvement');
      default:
        return type;
    }
  };

  const getVersionType = (version: string): 'major' | 'minor' | 'patch' => {
    const parts = version.split('.');
    if (parts[0] !== '0' && parts[1] === '0' && parts[2] === '0') return 'major';
    if (parts[2] === '0') return 'minor';
    return 'patch';
  };

  const getVersionColor = (type: string) => {
    switch (type) {
      case 'major':
        return 'from-blue-500 to-violet-600';
      case 'minor':
        return 'from-emerald-500 to-teal-600';
      case 'patch':
        return 'from-amber-500 to-orange-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backHome')}
          </Link>

          {/* Header */}
          <div className="mb-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mb-6">
              <History className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
            <p className="text-lg text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-xl bg-card border">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium border ${getTypeColor('feature')}`}>
                {t('feature')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium border ${getTypeColor('security')}`}>
                {t('security')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium border ${getTypeColor('improvement')}`}>
                {t('improvement')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium border ${getTypeColor('fix')}`}>
                {t('fix')}
              </span>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Timeline */}
          {!isLoading && (
            <div className="space-y-8">
              {versions.map((entry, index) => {
                const versionType = getVersionType(entry.version);
                return (
                  <div key={entry.version} className="relative">
                    {/* Version Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getVersionColor(versionType)} text-white font-bold`}>
                        <Tag className="w-4 h-4" />
                        v{entry.version}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(entry.date)}
                      </span>
                      {index === 0 && (
                        <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                          {t('latest')}
                        </span>
                      )}
                    </div>

                    {/* Changes */}
                    <div className="bg-card rounded-xl border p-6 ml-0 md:ml-6">
                      <ul className="space-y-3">
                        {entry.changes.map((change, changeIndex) => {
                          const Icon = getIconForText(change.text);
                          return (
                            <li key={changeIndex} className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(change.type)}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 pt-1">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 border ${getTypeColor(change.type)}`}>
                                  {getTypeLabel(change.type)}
                                </span>
                                <span className="text-sm">{change.text}</span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Connector Line */}
                    {index < versions.length - 1 && (
                      <div className="absolute left-[1.1rem] top-14 bottom-0 w-0.5 bg-border md:left-[2.35rem]" style={{ height: 'calc(100% - 3.5rem)' }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && versions.length === 0 && (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('noChanges')}</p>
            </div>
          )}

          {/* GitHub Link */}
          <div className="mt-12 p-6 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">{t('viewOnGithub')}</h3>
                  <p className="text-sm text-white/70">{t('githubDesc')}</p>
                </div>
              </div>
              <a
                href="https://github.com/Aprilox/ASuite"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 rounded-lg bg-white text-gray-900 font-medium hover:bg-white/90 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
