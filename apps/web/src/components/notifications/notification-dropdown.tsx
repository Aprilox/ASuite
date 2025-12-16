'use client';

import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Ticket } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLocale } from '@/providers/locale-provider';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    ticketId: string | null;
    ticketNumber: number | null;
    read: boolean;
    createdAt: string;
}

interface NotificationDropdownProps {
    notifications: Notification[];
    unreadCount: number;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onClose: () => void;
}

export function NotificationDropdown({
    notifications,
    unreadCount,
    onMarkAsRead,
    onMarkAllAsRead,
    onClose,
}: NotificationDropdownProps) {
    const router = useRouter();
    const { locale } = useLocale();
    const dateLocale = locale === 'fr' ? fr : enUS;

    const handleNotificationClick = (notification: Notification) => {
        // Marquer comme lu
        if (!notification.read) {
            onMarkAsRead(notification.id);
        }

        // Naviguer vers le ticket
        if (notification.ticketId && notification.ticketNumber) {
            // Déterminer l'URL selon le type
            const isAdminNotif = notification.type === 'ticket_new' || notification.type === 'ticket_response_client';
            const url = isAdminNotif
                ? `/admin/tickets/${notification.ticketId}`
                : `/support/${notification.ticketId}`;

            router.push(url);
            onClose();
        }
    };

    const formatDate = (date: string) => {
        try {
            return formatDistanceToNow(new Date(date), {
                addSuffix: true,
                locale: dateLocale,
            });
        } catch {
            return date;
        }
    };

    return (
        <div className="absolute right-0 top-full mt-2 w-96 bg-popover border rounded-lg shadow-lg z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                    <button
                        onClick={onMarkAllAsRead}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                        <CheckCheck className="w-3 h-3" />
                        Tout marquer comme lu
                    </button>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Bell className="w-12 h-12 mb-2 opacity-20" />
                        <p className="text-sm">Aucune notification</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {notifications.map((notification) => (
                            <button
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`w-full flex items-start gap-3 p-4 hover:bg-accent/50 transition-colors text-left ${!notification.read ? 'bg-primary/5' : ''
                                    }`}
                            >
                                <div className="flex-shrink-0 mt-1">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notification.type === 'ticket_new'
                                        ? 'bg-blue-100 dark:bg-blue-900/30'
                                        : notification.type === 'ticket_response_admin'
                                            ? 'bg-green-100 dark:bg-green-900/30'
                                            : 'bg-purple-100 dark:bg-purple-900/30'
                                        }`}>
                                        <Ticket className={`w-5 h-5 ${notification.type === 'ticket_new'
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : notification.type === 'ticket_response_admin'
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-purple-600 dark:text-purple-400'
                                            }`} />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <p className="font-medium text-sm line-clamp-1">
                                            {notification.title}
                                        </p>
                                        {!notification.read && (
                                            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1" />
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(notification.createdAt)}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
