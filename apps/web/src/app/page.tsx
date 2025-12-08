'use client';

import Link from 'next/link';
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

const tools = [
  {
    name: 'ALinks',
    description: 'Raccourcisseur de liens et QR codes',
    icon: Link2,
    color: 'bg-blue-500',
    href: '/alinks',
    status: 'active',
  },
  {
    name: 'AVault',
    description: 'Partage de notes chiffrées',
    icon: Lock,
    color: 'bg-violet-500',
    href: '/avault',
    status: 'coming',
  },
  {
    name: 'ATransfer',
    description: 'Transfert de fichiers jusqu\'à 50 Go',
    icon: Send,
    color: 'bg-emerald-500',
    href: '/atransfer',
    status: 'coming',
  },
  {
    name: 'ACalendar',
    description: 'Gestion d\'agenda et événements',
    icon: Calendar,
    color: 'bg-amber-500',
    href: '/acalendar',
    status: 'coming',
  },
  {
    name: 'AMail',
    description: 'Messagerie sécurisée',
    icon: Mail,
    color: 'bg-red-500',
    href: '/amail',
    status: 'coming',
  },
  {
    name: 'ADrive',
    description: 'Stockage cloud',
    icon: HardDrive,
    color: 'bg-cyan-500',
    href: '/adrive',
    status: 'coming',
  },
  {
    name: 'AMeet',
    description: 'Visioconférence',
    icon: Video,
    color: 'bg-pink-500',
    href: '/ameet',
    status: 'coming',
  },
  {
    name: 'ADocs',
    description: 'Traitement de texte collaboratif',
    icon: FileText,
    color: 'bg-indigo-500',
    href: '/adocs',
    status: 'coming',
  },
  {
    name: 'ASheets',
    description: 'Tableur en ligne',
    icon: Table,
    color: 'bg-green-500',
    href: '/asheets',
    status: 'coming',
  },
  {
    name: 'ASlides',
    description: 'Présentations et diaporamas',
    icon: Presentation,
    color: 'bg-orange-500',
    href: '/aslides',
    status: 'coming',
  },
];

const features = [
  {
    icon: Shield,
    title: 'Sécurisé',
    description: 'Vos données sont chiffrées et protégées',
  },
  {
    icon: Zap,
    title: 'Rapide',
    description: 'Performance optimisée pour tous les usages',
  },
  {
    icon: Globe,
    title: 'Accessible',
    description: 'Disponible partout, sur tous vos appareils',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="transparent" />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Suite collaborative nouvelle génération
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Votre{' '}
            <span className="bg-gradient-to-r from-blue-500 to-violet-600 bg-clip-text text-transparent">
              productivité
            </span>
            <br />
            réunie en un seul endroit
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Communiquez, partagez et donnez vie à vos idées en sécurité avec ASuite.
            Une suite d&apos;outils professionnels, simple et puissante.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors gap-2"
            >
              Démarrer gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/alinks"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-12 px-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Essayer ALinks
            </Link>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section id="tools" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Tous les outils dont vous avez besoin</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Une suite complète d&apos;applications pour gérer votre travail et collaborer efficacement.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.name}
                  href={tool.status === 'active' ? tool.href : '#'}
                  className={`group relative p-6 rounded-xl border bg-card hover:shadow-lg transition-all duration-300 ${
                    tool.status === 'coming' ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-1'
                  }`}
                  onClick={(e) => tool.status === 'coming' && e.preventDefault()}
                >
                  {tool.status === 'coming' && (
                    <span className="absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Bientôt
                    </span>
                  )}
                  <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{tool.name}</h3>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
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
            <h2 className="text-3xl font-bold mb-4">Pourquoi choisir ASuite ?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Une plateforme conçue pour la performance, la sécurité et la simplicité.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
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
            Prêt à booster votre productivité ?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Rejoignez des milliers d&apos;utilisateurs qui font confiance à ASuite pour leur travail quotidien.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-12 px-8 bg-white text-primary hover:bg-white/90 transition-colors gap-2"
          >
            Créer un compte gratuit
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
