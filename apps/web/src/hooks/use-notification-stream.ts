'use client';

import { useEffect, useCallback, useRef } from 'react';

interface NotificationEvent {
    type: string;
    ticketId?: string;
    ticketNumber?: number;
    title: string;
    message: string;
    createdAt: string;
}

export function useNotificationStream(
    onNotification: (notification: NotificationEvent) => void,
    enabled = true
) {
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

    const connect = useCallback(() => {
        if (!enabled) return;

        // Fermer la connexion existante si elle existe
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        try {
            const eventSource = new EventSource('/api/notifications/stream');
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log('[SSE] Connexion établie');
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Ignorer le message de connexion initial
                    if (data.type === 'connected') {
                        console.log('[SSE] Connecté, userId:', data.userId);
                        return;
                    }

                    // Traiter la notification
                    console.log('[SSE] Notification reçue:', data);
                    onNotification(data);
                } catch (error) {
                    console.error('[SSE] Erreur parsing message:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.error('[SSE] Erreur connexion:', error);
                eventSource.close();

                // Reconnexion automatique après 5 secondes
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('[SSE] Tentative de reconnexion...');
                    connect();
                }, 5000);
            };
        } catch (error) {
            console.error('[SSE] Erreur création EventSource:', error);
        }
    }, [enabled, onNotification]);

    useEffect(() => {
        connect();

        // Cleanup
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [connect]);

    return {
        reconnect: connect,
    };
}
