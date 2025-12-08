'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  ArrowLeft,
  Construction,
  Bell,
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
import { Header, Footer } from '@/components/layout';

const toolsInfo: Record<string, { name: string; description: string; icon: React.ElementType; color: string }> = {
  avault: {
    name: 'AVault',
    description: 'Partagez des notes et documents chiffrés de bout en bout. Vos données restent privées.',
    icon: Lock,
    color: 'from-violet-500 to-purple-600',
  },
  atransfer: {
    name: 'ATransfer',
    description: 'Transférez des fichiers volumineux jusqu\'à 50 Go facilement et en toute sécurité.',
    icon: Send,
    color: 'from-emerald-500 to-teal-600',
  },
  acalendar: {
    name: 'ACalendar',
    description: 'Gérez votre agenda, planifiez des événements et partagez vos disponibilités.',
    icon: Calendar,
    color: 'from-amber-500 to-orange-600',
  },
  amail: {
    name: 'AMail',
    description: 'Une messagerie sécurisée et respectueuse de votre vie privée.',
    icon: Mail,
    color: 'from-red-500 to-rose-600',
  },
  adrive: {
    name: 'ADrive',
    description: 'Stockez, synchronisez et partagez vos fichiers dans le cloud.',
    icon: HardDrive,
    color: 'from-cyan-500 to-blue-600',
  },
  ameet: {
    name: 'AMeet',
    description: 'Organisez des visioconférences sécurisées avec votre équipe.',
    icon: Video,
    color: 'from-pink-500 to-rose-600',
  },
  adocs: {
    name: 'ADocs',
    description: 'Créez et collaborez sur des documents en temps réel.',
    icon: FileText,
    color: 'from-indigo-500 to-blue-600',
  },
  asheets: {
    name: 'ASheets',
    description: 'Créez des feuilles de calcul puissantes et collaboratives.',
    icon: Table,
    color: 'from-green-500 to-emerald-600',
  },
  aslides: {
    name: 'ASlides',
    description: 'Créez des présentations percutantes et professionnelles.',
    icon: Presentation,
    color: 'from-orange-500 to-amber-600',
  },
};

function ComingSoonContent() {
  const searchParams = useSearchParams();
  const tool = searchParams.get('tool')?.toLowerCase();
  
  const toolInfo = tool && toolsInfo[tool] ? toolsInfo[tool] : null;
  const Icon = toolInfo?.icon || Construction;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-8 pt-24">
        <div className="max-w-lg text-center">
          {/* Icon */}
          <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${toolInfo?.color || 'from-blue-500 to-violet-600'} flex items-center justify-center mx-auto mb-8 shadow-lg`}>
            <Icon className="w-12 h-12 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold mb-4">
            {toolInfo ? toolInfo.name : 'Fonctionnalité'} arrive bientôt !
          </h1>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-8">
            {toolInfo 
              ? toolInfo.description 
              : 'Cette fonctionnalité est en cours de développement et sera disponible prochainement.'
            }
          </p>

          {/* Progress indicator */}
          <div className="bg-muted rounded-full h-2 mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-violet-600 h-full w-1/4 rounded-full animate-pulse" />
          </div>

          {/* Notify button (placeholder) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button 
              disabled
              className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-primary/10 text-primary font-medium cursor-not-allowed opacity-60"
            >
              <Bell className="w-4 h-4" />
              Me notifier (bientôt)
            </button>
          </div>

          {/* Back links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </Link>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <Link
              href="/alinks"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Link2 className="w-4 h-4" />
              Essayer ALinks (disponible)
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

export default function ComingSoonPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ComingSoonContent />
    </Suspense>
  );
}

