import { getSession } from '@/lib/auth';
import notificationManager from '@/lib/notification-manager';

// GET /api/notifications/stream - Stream SSE pour les notifications en temps réel
export async function GET(request: Request) {
    const user = await getSession();

    if (!user?.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    // Créer un stream SSE
    const stream = new ReadableStream({
        start(controller) {
            // Ajouter la connexion au gestionnaire
            notificationManager.addConnection(user.id, controller);

            console.log(`[SSE Stream] Connexion établie pour userId: ${user.id}`);

            // Envoyer un message de connexion initial
            const encoder = new TextEncoder();
            controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'connected', userId: user.id })}\n\n`)
            );

            // Gérer la fermeture de la connexion
            request.signal.addEventListener('abort', () => {
                notificationManager.removeConnection(user.id, controller);
                controller.close();
            });
        },
        cancel() {
            // Retirer la connexion si le client ferme
            notificationManager.removeConnection(user.id, undefined as any);
        },
    });

    // Retourner la réponse SSE
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
