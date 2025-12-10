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
  Video,
  FileText,
  Table,
  Presentation,
  ArrowRight,
  Shield,
  Zap,
  Globe,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const toolKeys = [
  { key: 'alinks', icon: Link2, color: 'bg-blue-500', href: '/alinks', status: 'active' },
  { key: 'avault', icon: Lock, color: 'bg-violet-500', href: '/avault', status: 'active' },
  { key: 'atransfer', icon: Send, color: 'bg-emerald-500', href: '/atransfer', status: 'coming' },
  { key: 'acalendar', icon: Calendar, color: 'bg-amber-500', href: '/acalendar', status: 'coming' },
  { key: 'amail', icon: Mail, color: 'bg-red-500', href: '/amail', status: 'coming' },
  { key: 'adrive', icon: HardDrive, color: 'bg-cyan-500', href: '/adrive', status: 'coming' },
  { key: 'ameet', icon: Video, color: 'bg-pink-500', href: '/ameet', status: 'coming' },
  { key: 'adocs', icon: FileText, color: 'bg-indigo-500', href: '/adocs', status: 'coming' },
  { key: 'asheets', icon: Table, color: 'bg-green-500', href: '/asheets', status: 'coming' },
  { key: 'aslides', icon: Presentation, color: 'bg-orange-500', href: '/aslides', status: 'coming' },
];

export default function HomePage() {
  const t = useTranslations('home');
  const tTools = useTranslations('tools');
  const tCommon = useTranslations('common');

  const features = [
    { icon: Shield, titleKey: 'secure', descKey: 'secureDesc' },
    { icon: Zap, titleKey: 'fast', descKey: 'fastDesc' },
    { icon: Globe, titleKey: 'accessible', descKey: 'accessibleDesc' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="transparent" />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            {t('badge')}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            {t('title1')}{' '}
            <span className="bg-gradient-to-r from-blue-500 to-violet-600 bg-clip-text text-transparent">
              {t('titleHighlight')}
            </span>
            <br />
            {t('title2')}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors gap-2"
            >
              {t('startFree')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/alinks"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-12 px-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {t('tryALinks')}
            </Link>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section id="tools" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('allTools')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('allToolsDesc')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {toolKeys.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.key}
                  href={tool.status === 'active' ? tool.href : '#'}
                  className={`group relative p-6 rounded-xl border bg-card hover:shadow-lg transition-all duration-300 ${
                    tool.status === 'coming' ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-1'
                  }`}
                  onClick={(e) => tool.status === 'coming' && e.preventDefault()}
                >
                  {tool.status === 'coming' && (
                    <span className="absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {tCommon('comingSoon')}
                    </span>
                  )}
                  <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{tTools(`${tool.key}.name`)}</h3>
                  <p className="text-sm text-muted-foreground">{tTools(`${tool.key}.description`)}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('whyChoose')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('whyChooseDesc')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.titleKey} className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t(feature.titleKey)}</h3>
                  <p className="text-muted-foreground">{t(feature.descKey)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-500 to-violet-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('ctaTitle')}
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            {t('ctaDesc')}
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-12 px-8 bg-white text-primary hover:bg-white/90 transition-colors gap-2"
          >
            {t('createFreeAccount')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
