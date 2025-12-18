import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { verifyEmailVerificationToken } from '@/lib/email';
import { checkGlobalRateLimit, getClientIp } from '@/lib/global-rate-limit';

export async function GET(request: Request) {
    try {
        // Rate limiting par IP pour prévenir les attaques par énumération de tokens
        const clientIp = getClientIp(request);
        const rateLimitResult = await checkGlobalRateLimit('email_verification_confirm', clientIp);

        if (!rateLimitResult.allowed) {
            return NextResponse.redirect(
                new URL(`/verify?error=too_many_attempts&retry=${rateLimitResult.retryAfter}`, request.url)
            );
        }

        // checkGlobalRateLimit a déjà incrémenté le compteur automatiquement

        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            // Rediriger vers page d'erreur (ou dashboard avec erreur)
            return NextResponse.redirect(new URL('/verify?error=missing_token', request.url));
        }

        const userId = await verifyEmailVerificationToken(token);

        if (!userId) {
            return NextResponse.redirect(new URL('/verify?error=invalid_token', request.url));
        }

        // Mettre à jour l'utilisateur
        await prisma.user.update({
            where: { id: userId },
            data: {
                emailVerified: new Date(),
                updatedAt: new Date()
            }
        });

        // Nettoyer le token (déjà fait par verifyEmailVerificationToken si expiré, mais bon pour le succès)
        // Note: Le token est maintenant hashé, donc cette suppression est déjà gérée dans verifyEmailVerificationToken

        // Rediriger vers le dashboard avec succès
        // Rediriger vers la page de succès de vérification
        return NextResponse.redirect(new URL('/verify?verified=true', request.url));

    } catch (error) {
        console.error('Verify email confirm error:', error);
        return NextResponse.redirect(new URL('/verify?error=server_error', request.url));
    }
}
