import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { isValidEmail } from '@asuite/utils';
import { generatePasswordResetToken, sendPasswordResetEmail } from '@/lib/email';
import { checkGlobalRateLimit, getClientIp } from '@/lib/global-rate-limit';

// POST /api/auth/forgot-password
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        // Validate email
        if (!email || !isValidEmail(email)) {
            return NextResponse.json(
                { error: 'Email invalide' },
                { status: 400 }
            );
        }

        const clientIp = getClientIp(request);

        // Check rate limit
        const rateLimit = await checkGlobalRateLimit('forgot_password', clientIp);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    error: rateLimit.reason,
                    retryAfter: rateLimit.retryAfter
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(rateLimit.retryAfter || 900),
                    },
                }
            );
        }

        // Always return success (security: don't reveal if email exists)
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { id: true, name: true, email: true, locale: true },
        });

        // Démarrer le timer au début pour éviter les timing attacks
        const startTime = Date.now();

        if (user) {
            // Generate token and send email (async, don't await to prevent timing attack)
            const token = await generatePasswordResetToken(user.id);

            if (token) {
                // Envoyer l'email dans la langue de l'utilisateur
                sendPasswordResetEmail(user.email, user.name, token, user.locale || 'fr').catch(err => {
                    console.error('Error sending password reset email:', err);
                });

                // Log the action (without revealing if email exists)
                prisma.auditLog.create({
                    data: {
                        userId: user.id,
                        action: 'password_reset_request',
                        resource: 'user',
                        resourceId: user.id,
                        metadata: JSON.stringify({ email: user.email }),
                    },
                }).catch(err => {
                    console.error('Error creating audit log:', err);
                });
            }
        }

        // Ajouter un délai constant pour éviter les timing attacks
        // Peu importe si l'utilisateur existe ou pas, la réponse prend toujours ~1 seconde
        const elapsedTime = Date.now() - startTime;
        const minimumDelay = 1000; // 1 seconde
        if (elapsedTime < minimumDelay) {
            await new Promise(resolve => setTimeout(resolve, minimumDelay - elapsedTime));
        }

        // Always return success (security: don't reveal if email exists)
        return NextResponse.json({
            success: true,
            message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la demande' },
            { status: 500 }
        );
    }
}
