'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Header, Footer } from '@/components/layout';
import { ArrowLeft, FileText, CheckCircle, User, AlertTriangle, Scale, Pencil, Mail, Check, X } from 'lucide-react';

export default function TermsPage() {
  const t = useTranslations('terms');

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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
            <p className="text-lg text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            {/* Acceptance */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('acceptance')}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t('acceptanceText')}</p>
            </section>

            {/* Description */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('description')}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t('descriptionText')}</p>
            </section>

            {/* Account */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-violet-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('account')}</h2>
              </div>
              <p className="text-muted-foreground mb-4">{t('accountText')}</p>
              <ul className="space-y-2">
                {['accountAccurate', 'accountSecure', 'accountResponsible'].map((key) => (
                  <li key={key} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-violet-500" />
                    </div>
                    <span className="text-muted-foreground">{t(key)}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Use Rules */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('useRules')}</h2>
              </div>
              <p className="text-muted-foreground mb-4">{t('useRulesText')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['ruleNoIllegal', 'ruleNoHarm', 'ruleNoAbuse', 'ruleNoInfringe'].map((key) => (
                  <div key={key} className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm">{t(key)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Intellectual Property */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('intellectualProperty')}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t('intellectualPropertyText')}</p>
            </section>

            {/* Limitation */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('limitation')}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t('limitationText')}</p>
            </section>

            {/* Termination */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <X className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('termination')}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t('terminationText')}</p>
            </section>

            {/* Modifications */}
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-cyan-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('modifications')}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{t('modificationsText')}</p>
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

            {/* Contact */}
            <section className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center">
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
