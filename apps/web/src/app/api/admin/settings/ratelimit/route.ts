import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { requireAdminPermission, getRequestInfo, createAuditLog } from '@/lib/admin-auth';

interface RateLimitEndpoint {
    id: string;
    name: string;
    description: string;
    maxAttempts: number;
    windowMinutes: number;
    blockMinutes: number;
}

const defaultEndpoints: RateLimitEndpoint[] = [
    {
        id: 'login',
        name: 'Connexion',
        description: 'Limite les tentatives de connexion pour prévenir le brute-force',
        maxAttempts: 10,
        windowMinutes: 15,
        blockMinutes: 15,
    },
    {
        id: 'forgot_password',
        name: 'Mot de passe oublié',
        description: 'Limite les demandes de réinitialisation de mot de passe',
        maxAttempts: 3,
        windowMinutes: 60,
        blockMinutes: 30,
    },
    {
        id: 'register',
        name: 'Inscription',
        description: 'Limite le nombre d\'inscriptions depuis une même IP',
        maxAttempts: 5,
        windowMinutes: 60,
        blockMinutes: 30,
    },
    {
        id: 'create_link',
        name: 'Création de liens (ALinks)',
        description: 'Limite la création de liens courts par utilisateur',
        maxAttempts: 20,
        windowMinutes: 60,
        blockMinutes: 15,
    },
    {
        id: 'create_vault',
        name: 'Création de notes (AVault)',
        description: 'Limite la création de notes chiffrées par utilisateur',
        maxAttempts: 30,
        windowMinutes: 60,
        blockMinutes: 15,
    },
    {
        id: 'admin_action',
        name: 'Actions administratives',
        description: 'Limite les actions admin (blocage, suppression, etc.)',
        maxAttempts: 50,
        windowMinutes: 60,
        blockMinutes: 10,
    },
];

// GET /api/admin/settings/ratelimit - Récupérer les paramètres
export async function GET() {
    try {
        await requireAdminPermission('settings.view');

        // Charger tous les paramètres de rate limiting
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: {
                    startsWith: 'ratelimit.',
                },
            },
        });

        // Construire les endpoints avec leurs valeurs
        const endpoints = defaultEndpoints.map((endpoint) => {
            const maxAttempts = settings.find((s) => s.key === `ratelimit.${endpoint.id}.max_attempts`);
            const windowMinutes = settings.find((s) => s.key === `ratelimit.${endpoint.id}.window_minutes`);
            const blockMinutes = settings.find((s) => s.key === `ratelimit.${endpoint.id}.block_minutes`);

            return {
                ...endpoint,
                maxAttempts: maxAttempts ? parseInt(maxAttempts.value, 10) : endpoint.maxAttempts,
                windowMinutes: windowMinutes ? parseInt(windowMinutes.value, 10) : endpoint.windowMinutes,
                blockMinutes: blockMinutes ? parseInt(blockMinutes.value, 10) : endpoint.blockMinutes,
            };
        });

        return NextResponse.json({ endpoints });
    } catch (error) {
        console.error('Rate limit settings fetch error:', error);

        if (error instanceof Error) {
            if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
                return NextResponse.json({ error: error.message }, { status: 403 });
            }
        }

        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// PATCH /api/admin/settings/ratelimit - Mettre à jour les paramètres
export async function PATCH(request: Request) {
    try {
        const admin = await requireAdminPermission('settings.edit');
        const { ipAddress, userAgent } = getRequestInfo(request);
        const body = await request.json();
        const { endpoints } = body as { endpoints: RateLimitEndpoint[] };

        if (!Array.isArray(endpoints)) {
            return NextResponse.json({ error: 'Format invalide' }, { status: 400 });
        }

        // Validate each endpoint
        for (const endpoint of endpoints) {
            if (!endpoint.id || !endpoint.maxAttempts || !endpoint.windowMinutes || !endpoint.blockMinutes) {
                return NextResponse.json(
                    { error: 'Données invalides' },
                    { status: 400 }
                );
            }

            if (endpoint.maxAttempts < 1 || endpoint.maxAttempts > 999999) {
                return NextResponse.json(
                    { error: `Tentatives max invalides pour ${endpoint.id}` },
                    { status: 400 }
                );
            }
            if (endpoint.windowMinutes < 1 || endpoint.windowMinutes > 1440) {
                return NextResponse.json(
                    { error: `Fenêtre invalide pour ${endpoint.name}` },
                    { status: 400 }
                );
            }
            if (endpoint.blockMinutes < 1 || endpoint.blockMinutes > 1440) {
                return NextResponse.json(
                    { error: `Durée de blocage invalide pour ${endpoint.name}` },
                    { status: 400 }
                );
            }

            // Upsert des paramètres
            await Promise.all([
                prisma.systemSetting.upsert({
                    where: { key: `ratelimit.${endpoint.id}.max_attempts` },
                    update: { value: endpoint.maxAttempts.toString() },
                    create: {
                        key: `ratelimit.${endpoint.id}.max_attempts`,
                        value: endpoint.maxAttempts.toString(),
                        type: 'number',
                        category: 'security',
                        label: `Rate Limit ${endpoint.name} - Tentatives max`,
                    },
                }),
                prisma.systemSetting.upsert({
                    where: { key: `ratelimit.${endpoint.id}.window_minutes` },
                    update: { value: endpoint.windowMinutes.toString() },
                    create: {
                        key: `ratelimit.${endpoint.id}.window_minutes`,
                        value: endpoint.windowMinutes.toString(),
                        type: 'number',
                        category: 'security',
                        label: `Rate Limit ${endpoint.name} - Fenêtre (minutes)`,
                    },
                }),
                prisma.systemSetting.upsert({
                    where: { key: `ratelimit.${endpoint.id}.block_minutes` },
                    update: { value: endpoint.blockMinutes.toString() },
                    create: {
                        key: `ratelimit.${endpoint.id}.block_minutes`,
                        value: endpoint.blockMinutes.toString(),
                        type: 'number',
                        category: 'security',
                        label: `Rate Limit ${endpoint.name} - Blocage (minutes)`,
                    },
                }),
            ]);
        }

        // Audit log
        await createAuditLog(
            admin.id,
            'admin.settings.ratelimit.update',
            'settings',
            undefined,
            { count: endpoints.length },
            ipAddress,
            userAgent
        );

        return NextResponse.json({
            message: 'Paramètres de rate limiting enregistrés',
        });
    } catch (error) {
        console.error('Rate limit settings update error:', error);

        if (error instanceof Error) {
            if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
                return NextResponse.json({ error: error.message }, { status: 403 });
            }
        }

        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
