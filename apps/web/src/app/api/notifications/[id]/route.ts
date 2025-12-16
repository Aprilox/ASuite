import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { markNotificationAsRead } from '@/lib/notification-helpers';

// PATCH /api/notifications/[id] - Marquer une notification comme lue
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getSession();

        if (!user?.id) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const { id } = await params;
        const success = await markNotificationAsRead(id, user.id);

        if (!success) {
            return NextResponse.json({ error: 'Notification non trouvée' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur PATCH /api/notifications/[id]:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
