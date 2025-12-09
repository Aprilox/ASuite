'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, Construction } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="font-bold text-2xl">ASuite</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <Construction className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Mot de passe oublié</h1>
            
            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium mb-4">
              Bientôt disponible
            </span>
            
            <p className="text-muted-foreground mb-6">
              La fonctionnalité de réinitialisation de mot de passe est en cours de développement. 
              Elle sera disponible très prochainement.
            </p>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 mb-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="w-5 h-5 text-primary" />
                <span>En attendant, contactez le support si vous avez besoin d'aide.</span>
              </div>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          © {new Date().getFullYear()} ASuite. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}

