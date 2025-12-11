import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { isValidEmail } from '@asuite/utils';
import { generatePasswordResetToken, sendPasswordResetEmail } from '@/lib/email';

// Rate limiting: max 3 requests per email per hour
const RATE_LIMIT_MAX_REQUESTS = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// In-memory rate limit store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(email: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const key = email.toLowerCase();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
        // No record or expired, create new
        rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return { allowed: true };
    }

    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((record.resetTime - now) / 1000 / 60); // minutes
        return { allowed: false, retryAfter };
    }

    // Increment count
    record.count++;
    return { allowed: true };
}

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

        // Check rate limit
        const rateLimit = checkRateLimit(email);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    error: `Trop de demandes. Réessayez dans ${rateLimit.retryAfter} minute(s).`,
                    retryAfter: rateLimit.retryAfter
                },
                { status: 429 }
            );
        }

        // Always return success to prevent email enumeration
        // But only actually send email if user exists
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { id: true, name: true, email: true, locale: true },
        });

        if (user) {
            // Generate token and send email
            const token = await generatePasswordResetToken(user.id);

            if (token) {
                // Envoyer l'email dans la langue de l'utilisateur
                await sendPasswordResetEmail(user.email, user.name, token, user.locale || 'fr');

                // Log the action (without revealing if email exists)
                await prisma.auditLog.create({
                    data: {
                        userId: user.id,
                        action: 'password_reset_request',
                        resource: 'user',
                        resourceId: user.id,
                        metadata: JSON.stringify({ email: user.email }),
                    },
                });
            }
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
