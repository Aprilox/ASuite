'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/use-notifications';

export function ClientNotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { notifications, unreadCount } = useNotifications();
    const router = useRouter();

    // Fermer le dropdown quand on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (ticketId: string | null) => {
        setIsOpen(false);
        if (ticketId) {
            router.push(`/support/${ticketId}`);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)} h`;
        return `Il y a ${Math.floor(diffMins / 1440)} j`;
    };

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-popover border rounded-lg shadow-lg overflow-hidden z-50">
                        <div className="p-3 border-b">
                            <h3 className="font-medium">Notifications</h3>
                        </div>
                        <div className="overflow-y-auto max-h-80">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground text-sm">
                                    Aucune notification
                                </div>
                            ) : (
                                notifications.slice(0, 10).map((notif) => (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif.ticketId)}
                                        className={`w-full p-3 text-left hover:bg-accent transition-colors border-b last:border-0 ${!notif.read ? 'bg-primary/5' : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            {!notif.read && (
                                                <span className="w-2 h-2 rounded-full bg-red-600 mt-1.5 shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{notif.title}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                    {notif.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatTime(notif.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                        {notifications.length > 0 && (
                            <div className="p-2 border-t">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        router.push('/support');
                                    }}
                                    className="w-full px-3 py-1.5 text-sm text-center text-primary hover:bg-accent rounded transition-colors"
                                >
                                    Voir tous les tickets
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
