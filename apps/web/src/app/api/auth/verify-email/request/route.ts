import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email';
import { prisma } from '@asuite/database';
import { checkGlobalRateLimit } from '@/lib/global-rate-limit';

export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        // Vérifier si déjà vérifié
        if (session.emailVerified) {
            return NextResponse.json({ message: 'Email déjà vérifié' });
        }

        // Rate Limiting Global
        const rateLimitResult = await checkGlobalRateLimit('email_verification', session.id);
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: rateLimitResult.reason },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(rateLimitResult.retryAfter || 900),
                    },
                }
            );
        }

        // Optionnel: Limiter l'envoi s'il y a déjà un token très récent (ex: < 1 minute)
        // Ici on simplifie en régénérant à chaque fois pour l'UX

        const token = await generateVerificationToken(session.id);

        if (!token) {
            return NextResponse.json({ error: 'Erreur génération token' }, { status: 500 });
        }

        const sent = await sendVerificationEmail(
            session.email,
            session.name,
            token,
            session.locale
        );

        if (!sent) {
            return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Email envoyé' });

    } catch (error) {
        console.error('Verify email request error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
