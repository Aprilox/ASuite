'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './auth-provider';

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
    ticketUnreadCount: number; // Notifications de tickets uniquement
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
    const [ticketUnreadCount, setTicketUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchNotifications = useCallback(async () => {
        // Ne charger que si l'utilisateur est connecté
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setTicketUnreadCount(0);
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/notifications');

            // Si 401 (not authenticated), ne pas considérer comme erreur
            if (res.status === 401) {
                setNotifications([]);
                setUnreadCount(0);
                setTicketUnreadCount(0);
                setLoading(false);
                return;
            }

            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
                // Compter uniquement les notifications de réponse admin sur tickets (pas les nouveaux tickets clients)
                // Les admin ne devraient voir que leurs propres tickets dans Support
                const ticketCount = data.notifications.filter(
                    (n: Notification) => !n.read && n.ticketId !== null && n.type === 'ticket_response_admin'
                ).length;
                setTicketUnreadCount(ticketCount);
            }
        } catch (error) {
            // Ignorer silencieusement si pas authentifié
            console.debug('Notifications not loaded');
        } finally {
            setLoading(false);
        }
    }, [user]);

    const markAsRead = useCallback(async (notificationId: string) => {
        // Trouver la notification avant de la marquer
        const notification = notifications.find(n => n.id === notificationId);
        const wasUnread = notification && !notification.read;
        const isTicketResponse = notification && notification.ticketId !== null && notification.type === 'ticket_response_admin';

        // Mise à jour optimiste immédiate
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === notificationId
                    ? { ...notif, read: true }
                    : notif
            )
        );
        if (wasUnread) {
            setUnreadCount(prev => Math.max(0, prev - 1));
            if (isTicketResponse) {
                setTicketUnreadCount(prev => Math.max(0, prev - 1));
            }
        }

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
                if (wasUnread) {
                    setUnreadCount(prev => prev + 1);
                    if (isTicketResponse) {
                        setTicketUnreadCount(prev => prev + 1);
                    }
                }
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
            if (wasUnread) {
                setUnreadCount(prev => prev + 1);
                if (isTicketResponse) {
                    setTicketUnreadCount(prev => prev + 1);
                }
            }
        }
    }, [notifications]);

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
                setTicketUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }, []);

    const addNotification = useCallback((notification: Notification) => {
        setNotifications(prev => [notification, ...prev].slice(0, 30));
        if (!notification.read) {
            setUnreadCount(prev => prev + 1);
            // Seulement incrémenter pour les réponses admin, pas les nouveaux tickets clients
            if (notification.ticketId !== null && notification.type === 'ticket_response_admin') {
                setTicketUnreadCount(prev => prev + 1);
            }
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
                ticketUnreadCount,
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
