'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Header, Footer } from '@/components/layout';
import { ArrowLeft, Shield, Database, Lock, UserCheck, Users, Mail, Check } from 'lucide-react';

export default function PrivacyPage() {
  const t = useTranslations('privacy');

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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
            <p className="text-lg text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            {/* Data Collection */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('dataCollection')}</h2>
              </div>
              <p className="text-muted-foreground mb-4">{t('dataCollectionText')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'dataEmail', icon: Mail },
                  { key: 'dataName', icon: UserCheck },
                  { key: 'dataPassword', icon: Lock },
                  { key: 'dataUsage', icon: Database },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{t(item.key)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Data Use */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-violet-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('dataUse')}</h2>
              </div>
              <p className="text-muted-foreground mb-4">{t('dataUseText')}</p>
              <ul className="space-y-2">
                {['useAuthentication', 'useServices', 'useImprovement', 'useSecurity'].map((key) => (
                  <li key={key} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <span className="text-muted-foreground">{t(key)}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Data Storage */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('dataStorage')}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t('dataStorageText')}</p>
            </section>

            {/* Data Security */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('dataSecurity')}</h2>
              </div>
              <p className="text-muted-foreground mb-4">{t('dataSecurityText')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: 'securityEncryption', color: 'bg-blue-500/10 text-blue-500' },
                  { key: 'securityHttps', color: 'bg-green-500/10 text-green-500' },
                  { key: 'securityAccess', color: 'bg-violet-500/10 text-violet-500' },
                ].map((item) => (
                  <div key={item.key} className="p-4 rounded-lg bg-muted/50 text-center">
                    <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mx-auto mb-2`}>
                      <Lock className="w-5 h-5" />
                    </div>
                    <p className="text-sm">{t(item.key)}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Your Rights */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-cyan-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('yourRights')}</h2>
              </div>
              <p className="text-muted-foreground mb-4">{t('yourRightsText')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['rightAccess', 'rightRectification', 'rightDeletion', 'rightPortability'].map((key) => (
                  <div key={key} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Check className="w-4 h-4 text-cyan-500" />
                    <span className="text-sm">{t(key)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Third Parties */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-pink-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('thirdParties')}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t('thirdPartiesText')}</p>
            </section>

            {/* Contact */}
            <section className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
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
