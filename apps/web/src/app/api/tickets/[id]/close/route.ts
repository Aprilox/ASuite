import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { getSession } from '@/lib/auth';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session?.id) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { id } = params;

        // Récupérer le ticket
        const ticket = await prisma.ticket.findUnique({
            where: { id },
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 });
        }

        // Vérifier que l'utilisateur est le propriétaire du ticket
        if (ticket.userId !== session.id) {
            return NextResponse.json(
                { error: 'Vous ne pouvez clore que vos propres tickets' },
                { status: 403 }
            );
        }

        // Vérifier si le ticket est déjà fermé
        if (ticket.status === 'closed') {
            return NextResponse.json(
                { error: 'Ce ticket est déjà fermé' },
                { status: 400 }
            );
        }

        // Clore le ticket
        await prisma.ticket.update({
            where: { id },
            data: {
                status: 'closed',
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Ticket clos avec succès',
        });
    } catch (error) {
        console.error('Error closing ticket:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la clôture du ticket' },
            { status: 500 }
        );
    }
}
