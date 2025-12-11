import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { hash } from 'bcryptjs';
import { checkPasswordStrength } from '@asuite/utils';
import { verifyPasswordResetToken, deletePasswordResetToken } from '@/lib/email';

// POST /api/auth/reset-password
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { token, password, confirmPassword } = body;

        // Validate inputs
        if (!token) {
            return NextResponse.json(
                { error: 'Token manquant' },
                { status: 400 }
            );
        }

        if (!password || !confirmPassword) {
            return NextResponse.json(
                { error: 'Mot de passe requis' },
                { status: 400 }
            );
        }

        if (password !== confirmPassword) {
            return NextResponse.json(
                { error: 'Les mots de passe ne correspondent pas' },
                { status: 400 }
            );
        }

        // Check password strength
        const passwordCheck = checkPasswordStrength(password);
        if (passwordCheck.score < 3) {
            return NextResponse.json(
                { error: 'Le mot de passe ne respecte pas les critères requis' },
                { status: 400 }
            );
        }

        // Verify token
        const userId = await verifyPasswordResetToken(token);
        if (!userId) {
            return NextResponse.json(
                { error: 'Le lien de réinitialisation est invalide ou a expiré' },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 404 }
            );
        }

        // Hash new password
        const hashedPassword = await hash(password, 12);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        // Invalidate all sessions for this user (security)
        await prisma.session.deleteMany({
            where: { userId },
        });

        // Delete the used token
        await deletePasswordResetToken(token);

        // Log the action
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'password_reset_complete',
                resource: 'user',
                resourceId: user.id,
                metadata: JSON.stringify({ email: user.email }),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la réinitialisation' },
            { status: 500 }
        );
    }
}

// GET /api/auth/reset-password?token=xxx - Verify token validity
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { valid: false, error: 'Token manquant' },
                { status: 400 }
            );
        }

        const userId = await verifyPasswordResetToken(token);

        if (!userId) {
            return NextResponse.json(
                { valid: false, error: 'Le lien de réinitialisation est invalide ou a expiré' },
                { status: 400 }
            );
        }

        return NextResponse.json({ valid: true });

    } catch (error) {
        console.error('Verify reset token error:', error);
        return NextResponse.json(
            { valid: false, error: 'Erreur de vérification' },
            { status: 500 }
        );
    }
}
