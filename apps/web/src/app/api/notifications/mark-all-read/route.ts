import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { markAllNotificationsAsRead } from '@/lib/notification-helpers';

// POST /api/notifications/mark-all-read - Marquer toutes les notifications comme lues
export async function POST() {
    try {
        const user = await getSession();

        if (!user?.id) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const count = await markAllNotificationsAsRead(user.id);

        return NextResponse.json({
            success: true,
            count,
        });
    } catch (error) {
        console.error('Erreur POST /api/notifications/mark-all-read:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
