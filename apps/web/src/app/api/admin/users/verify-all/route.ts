import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { isAdmin } from '@/lib/auth';

export async function POST() {
    try {
        const isUserAdmin = await isAdmin();

        if (!isUserAdmin) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        // Mettre à jour tous les utilisateurs non vérifiés
        const result = await prisma.user.updateMany({
            where: {
                emailVerified: null,
            },
            data: {
                emailVerified: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            count: result.count,
            message: `${result.count} utilisateurs ont été vérifiés.`
        });

    } catch (error) {
        console.error('Error verifying all users:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
