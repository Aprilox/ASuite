/**
 * Gestionnaire des connexions SSE pour les notifications en temps réel
 * Singleton pour gérer toutes les connexions actives
 */

type SSEConnection = {
    controller: ReadableStreamDefaultController;
    userId: string;
};

class NotificationManager {
    private connections: Map<string, SSEConnection[]> = new Map();

    /**
     * Ajoute une connexion SSE pour un utilisateur
     */
    addConnection(userId: string, controller: ReadableStreamDefaultController) {
        const userConnections = this.connections.get(userId) || [];
        userConnections.push({ controller, userId });
        this.connections.set(userId, userConnections);

        console.log(`[SSE] Connexion ajoutée pour user ${userId}. Total: ${userConnections.length}`);
    }

    /**
     * Retire une connexion SSE
     */
    removeConnection(userId: string, controller: ReadableStreamDefaultController) {
        const userConnections = this.connections.get(userId) || [];
        const filtered = userConnections.filter(conn => conn.controller !== controller);

        if (filtered.length > 0) {
            this.connections.set(userId, filtered);
        } else {
            this.connections.delete(userId);
        }

        console.log(`[SSE] Connexion retirée pour user ${userId}. Restantes: ${filtered.length}`);
    }

    /**
     * Envoie une notification à un utilisateur spécifique
     */
    sendToUser(userId: string, notification: any) {
        const userConnections = this.connections.get(userId) || [];
        const data = `data: ${JSON.stringify(notification)}\n\n`;

        for (const conn of userConnections) {
            try {
                const encoder = new TextEncoder();
                conn.controller.enqueue(encoder.encode(data));
            } catch (error) {
                console.error(`[SSE] Erreur envoi à user ${userId}:`, error);
            }
        }

        console.log(`[SSE] Notification envoyée à ${userConnections.length} connexion(s) pour user ${userId}`);
    }

    /**
     * Envoie une notification à tous les utilisateurs connectés
     */
    broadcast(notification: any) {
        const data = `data: ${JSON.stringify(notification)}\n\n`;
        const encoder = new TextEncoder();

        for (const [userId, userConnections] of this.connections.entries()) {
            for (const conn of userConnections) {
                try {
                    conn.controller.enqueue(encoder.encode(data));
                } catch (error) {
                    console.error(`[SSE] Erreur broadcast à user ${userId}:`, error);
                }
            }
        }
    }

    /**
     * Envoie un heartbeat à toutes les connexions pour maintenir la connexion
     */
    sendHeartbeat() {
        const heartbeat = ': heartbeat\n\n';
        const encoder = new TextEncoder();

        for (const userConnections of this.connections.values()) {
            for (const conn of userConnections) {
                try {
                    conn.controller.enqueue(encoder.encode(heartbeat));
                } catch (error) {
                    // Ignorer les erreurs de heartbeat (connexion probablement fermée)
                }
            }
        }
    }

    /**
     * Retourne le nombre total de connexions actives
     */
    getConnectionCount(): number {
        let count = 0;
        for (const userConnections of this.connections.values()) {
            count += userConnections.length;
        }
        return count;
    }
}

// Singleton global qui persiste à travers les hot reloads de Next.js
declare global {
    var notificationManager: NotificationManager | undefined;
}

const notificationManager = globalThis.notificationManager ?? new NotificationManager();

if (process.env.NODE_ENV !== 'production') {
    globalThis.notificationManager = notificationManager;
}

// Heartbeat toutes les 30 secondes pour maintenir les connexions
if (typeof global !== 'undefined' && !globalThis.notificationManager) {
    const heartbeatInterval = setInterval(() => {
        notificationManager.sendHeartbeat();
    }, 30000);

    // Nettoyer l'interval si le serveur s'arrête
    if (process.on) {
        process.on('beforeExit', () => {
            clearInterval(heartbeatInterval);
        });
    }
}

export default notificationManager;
