'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Header, Footer } from '@/components/layout';
import { ArrowLeft, Cookie, Settings, Users, Mail, Clock, Globe, Palette } from 'lucide-react';

export default function CookiesPage() {
  const t = useTranslations('cookies');

  const cookiesData = [
    {
      name: 'session',
      purpose: t('sessionPurpose'),
      duration: t('sessionDuration'),
      icon: Clock,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      name: 'locale',
      purpose: t('localePurpose'),
      duration: t('localeDuration'),
      icon: Globe,
      color: 'text-green-500 bg-green-500/10',
    },
    {
      name: 'asuite-theme',
      purpose: t('themePurpose'),
      duration: t('themeDuration'),
      icon: Palette,
      color: 'text-violet-500 bg-violet-500/10',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Link */}
          <Link
            href="/legal"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToLegal')}
          </Link>

          {/* Header */}
          <div className="mb-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6">
              <Cookie className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
            <p className="text-lg text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            {/* What are Cookies */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Cookie className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('whatAreCookies')}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t('whatAreCookiesText')}</p>
            </section>

            {/* Cookies We Use */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('cookiesWeUse')}</h2>
              </div>
              <p className="text-muted-foreground mb-6">{t('cookiesWeUseText')}</p>

              {/* Essential Cookies */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  {t('essentialCookies')}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">{t('essentialCookiesText')}</p>
                
                <div className="space-y-3">
                  {cookiesData.map((cookie) => (
                    <div key={cookie.name} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cookie.color}`}>
                        <cookie.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{cookie.name}</code>
                        <p className="text-sm text-muted-foreground mt-1">{cookie.purpose}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">{t('cookieDuration')}</span>
                        <p className="text-sm font-medium">{cookie.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="p-4 rounded-lg bg-muted/30 border border-dashed">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                  {t('functionalCookies')}
                </h3>
                <p className="text-muted-foreground text-sm">{t('functionalCookiesText')}</p>
              </div>
            </section>

            {/* Manage Cookies */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-violet-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('manageCookies')}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t('manageCookiesText')}</p>
            </section>

            {/* Third Party Cookies */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('thirdPartyCookies')}</h2>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-green-700 dark:text-green-400">{t('thirdPartyCookiesText')}</p>
              </div>
            </section>

            {/* Contact */}
            <section className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold">{t('contact')}</h2>
              </div>
              <p className="text-muted-foreground mb-4">{t('contactText')}</p>
              <a 
                href="mailto:contact@aprilox.fr" 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Mail className="w-4 h-4" />
                contact@aprilox.fr
              </a>
            </section>

            {/* Last Update */}
            <div className="text-center pt-8 border-t">
              <p className="text-sm text-muted-foreground">
                {t('lastUpdate')} : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
