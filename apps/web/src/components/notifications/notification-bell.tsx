'use client';

import { Bell } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { useNotificationStream } from '@/hooks/use-notification-stream';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead, addNotification } = useNotifications();
    const [hasNewNotification, setHasNewNotification] = useState(false);

    // Gérer les nouvelles notifications en temps réel
    const handleNewNotification = useCallback((notification: any) => {
        // Ajouter la notification à la liste avec le vrai ID de la base de données
        addNotification({
            id: notification.id, // Utiliser le vrai ID envoyé par SSE
            type: notification.type,
            title: notification.title,
            message: notification.message,
            ticketId: notification.ticketId || null,
            ticketNumber: notification.ticketNumber || null,
            read: false,
            createdAt: notification.createdAt,
        });

        // Animation pulse
        setHasNewNotification(true);
        setTimeout(() => setHasNewNotification(false), 3000);

        // Notification desktop si permission accordée
        if ('Notification' in window && Notification.permission === 'granted') {
            // Ne notifier que si la fenêtre n'est pas en focus
            if (document.hidden) {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/icon-192.png',
                    tag: `ticket-${notification.ticketNumber}`,
                });
            }
        }
    }, [addNotification]);

    // Connexion SSE
    useNotificationStream(handleNewNotification, true);

    // Demander la permission pour les notifications desktop au montage
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 hover:bg-accent rounded-lg transition-colors ${hasNewNotification ? 'animate-pulse' : ''
                    }`}
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <NotificationDropdown
                        notifications={notifications}
                        unreadCount={unreadCount}
                        onMarkAsRead={markAsRead}
                        onMarkAllAsRead={markAllAsRead}
                        onClose={() => setIsOpen(false)}
                    />
                </>
            )}
        </div>
    );
}
