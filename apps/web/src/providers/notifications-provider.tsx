'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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

interface NotificationsContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    addNotification: (notification: Notification) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const markAsRead = useCallback(async (notificationId: string) => {
        // Mise à jour optimiste immédiate
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === notificationId
                    ? { ...notif, read: true }
                    : notif
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            const res = await fetch(`/api/notifications/${notificationId}`, {
                method: 'PATCH',
            });

            if (!res.ok) {
                // Revert si erreur
                setNotifications(prev =>
                    prev.map(notif =>
                        notif.id === notificationId
                            ? { ...notif, read: false }
                            : notif
                    )
                );
                setUnreadCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === notificationId
                        ? { ...notif, read: false }
                        : notif
                )
            );
            setUnreadCount(prev => prev + 1);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications/mark-all-read', {
                method: 'POST',
            });

            if (res.ok) {
                setNotifications(prev =>
                    prev.map(notif => ({ ...notif, read: true }))
                );
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }, []);

    const addNotification = useCallback((notification: Notification) => {
        setNotifications(prev => [notification, ...prev].slice(0, 30));
        if (!notification.read) {
            setUnreadCount(prev => prev + 1);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return (
        <NotificationsContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                fetchNotifications,
                markAsRead,
                markAllAsRead,
                addNotification,
            }}
        >
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationsContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }
    return context;
}
