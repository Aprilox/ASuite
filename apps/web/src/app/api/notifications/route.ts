import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserNotifications, countUnreadNotifications } from '@/lib/notification-helpers';

// GET /api/notifications - Récupérer les notifications de l'utilisateur
export async function GET() {
    try {
        const user = await getSession();

        if (!user?.id) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const [notifications, unreadCount] = await Promise.all([
            getUserNotifications(user.id, 30),
            countUnreadNotifications(user.id),
        ]);

        console.log(`[Notifications API] User ${user.id}: ${notifications.length} notifications, ${unreadCount} unread`);

        return NextResponse.json({
            notifications,
            unreadCount,
        });
    } catch (error) {
        console.error('Erreur GET /api/notifications:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
