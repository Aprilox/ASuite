'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

// Liste des chemins autorisés même si l'email n'est pas vérifié
// Note: /verify-email est implicitement autorisé
const ALLOWED_PATHS = [
    '/api/auth/logout',
    '/logout',
    '/verify',
];

export function VerificationGuard() {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, user, isLoading } = useAuth();

    useEffect(() => {
        // Ne rien faire tant que le chargement n'est pas terminé
        if (isLoading) return;

        // Si l'utilisateur n'est pas connecté, on ne fait rien (la protection des routes privées est gérée ailleurs)
        if (!isAuthenticated || !user) return;

        // Si la vérification n'est pas requise ou si l'email est déjà vérifié, tout va bien
        if (!user.verificationRequired || user.emailVerified) return;

        // Si on est déjà sur la page de vérification, on ne fait rien
        if (pathname === '/verify-email') return;

        // Si on est sur une route autorisée (ex: logout), on laisse passer
        if (ALLOWED_PATHS.includes(pathname)) return;

        // Sinon, on redirige vers la page de vérification
        router.push('/verify-email');

    }, [isLoading, isAuthenticated, user, pathname, router]);

    return null; // Ce composant ne rend rien visuellement
}
