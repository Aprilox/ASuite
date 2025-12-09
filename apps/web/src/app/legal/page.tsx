'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Header, Footer } from '@/components/layout';
import { ArrowLeft, Scale, Shield, FileText, Cookie, Mail, Globe, Building2 } from 'lucide-react';

export default function LegalPage() {
  const t = useTranslations('legal');

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
              <Scale className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
            <p className="text-lg text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <Link
              href="/privacy"
              className="p-6 rounded-xl border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all group"
            >
              <Shield className="w-10 h-10 text-blue-500 mb-4" />
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                {t('privacyTitle')}
              </h3>
              <p className="text-sm text-muted-foreground">{t('privacyDesc')}</p>
            </Link>
            <Link
              href="/terms"
              className="p-6 rounded-xl border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all group"
            >
              <FileText className="w-10 h-10 text-violet-500 mb-4" />
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                {t('termsTitle')}
              </h3>
              <p className="text-sm text-muted-foreground">{t('termsDesc')}</p>
            </Link>
            <Link
              href="/cookies"
              className="p-6 rounded-xl border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all group"
            >
              <Cookie className="w-10 h-10 text-amber-500 mb-4" />
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                {t('cookiesTitle')}
              </h3>
              <p className="text-sm text-muted-foreground">{t('cookiesDesc')}</p>
            </Link>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            {/* Company Info */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('companyInfo')}</h2>
              </div>
              <p className="text-muted-foreground mb-4">{t('companyInfoText')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">{t('companyName')}</p>
                  <p className="font-medium">ASuite</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">{t('contact')}</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    contact@aprilox.fr
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">{t('website')}</p>
                  <p className="font-medium flex items-center gap-2 text-muted-foreground">
                    <Globe className="w-4 h-4" />
                    N/A
                  </p>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-violet-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('intellectualProperty')}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t('intellectualPropertyText')}</p>
            </section>

            {/* Liability */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('liability')}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t('liabilityText')}</p>
            </section>

            {/* Applicable Law */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('applicableLaw')}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t('applicableLawText')}</p>
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
