'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';
import { useAdmin } from '@/hooks/use-admin';
import {
    Shield,
    Loader2,
    Save,
    RotateCcw,
    Info,
    Clock,
    Ban,
} from 'lucide-react';

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
        description: "Limite le nombre d'inscriptions depuis une même IP",
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
    {
        id: 'email_verification',
        name: 'Vérification Email',
        description: "Limite les demandes de renvoi d'email de vérification",
        maxAttempts: 3,
        windowMinutes: 60,
        blockMinutes: 30,
    },
    {
        id: 'email_verification_confirm',
        name: 'Confirmation Email (IP)',
        description: "Limite les tentatives de validation de token par IP",
        maxAttempts: 10,
        windowMinutes: 60,
        blockMinutes: 15,
    },
];

export default function RateLimitSettingsPage() {
    const toast = useToast();
    const t = useTranslations('admin.settings');
    const { hasPermission } = useAdmin();

    const canEdit = hasPermission('settings.edit');

    const [endpoints, setEndpoints] = useState<RateLimitEndpoint[]>(defaultEndpoints);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changes, setChanges] = useState<Record<string, RateLimitEndpoint>>({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings/ratelimit');
            if (res.ok) {
                const data = await res.json();
                setEndpoints(data.endpoints || defaultEndpoints);
            }
        } catch (error) {
            toast.error('Erreur lors du chargement des paramètres');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (endpointId: string, field: string, value: number) => {
        const endpoint = endpoints.find((e) => e.id === endpointId);
        if (!endpoint) return;

        const updated = {
            ...endpoint,
            [field]: value,
        };

        setChanges((prev) => ({
            ...prev,
            [endpointId]: updated,
        }));

        setEndpoints((prev) =>
            prev.map((e) => (e.id === endpointId ? updated : e))
        );
    };

    const handleSave = async () => {
        if (Object.keys(changes).length === 0) {
            toast.info('Aucune modification à enregistrer');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings/ratelimit', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoints: Object.values(changes) }),
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(data.message || 'Paramètres enregistrés');
                setChanges({});
                fetchSettings();
            } else {
                const data = await res.json();
                toast.error(data.error || "Erreur lors de l'enregistrement");
            }
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setEndpoints(defaultEndpoints);
        setChanges({});
    };

    const hasChanges = Object.keys(changes).length > 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-amber-500" />
                        </div>
                        <h1 className="text-2xl font-bold">{t('rateLimit.title')}</h1>
                    </div>
                    <p className="text-muted-foreground mt-2">
                        {t('rateLimit.subtitle')}
                    </p>
                </div>
                {canEdit && hasChanges && (
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleReset}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border hover:bg-accent transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('rateLimit.reset')}</span>
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {t('rateLimit.save')}
                        </button>
                    </div>
                )}
            </div>

            {/* Info banner */}
            <div className="flex gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-600 dark:text-blue-400">
                    <p className="font-medium mb-1">{t('rateLimit.infoTitle')}</p>
                    <ul className="space-y-1 text-blue-600/80 dark:text-blue-400/80">
                        <li>• <strong>{t('rateLimit.maxAttempts')}</strong> : {t('rateLimit.infoMaxAttempts')}</li>
                        <li>• <strong>{t('rateLimit.window')}</strong> : {t('rateLimit.infoWindow')}</li>
                        <li>• <strong>{t('rateLimit.blockDuration')}</strong> : {t('rateLimit.infoBlock')}</li>
                    </ul>
                </div>
            </div>

            {/* Endpoints list */}
            <div className="space-y-4">
                {endpoints.map((endpoint) => {
                    const isModified = changes[endpoint.id] !== undefined;

                    return (
                        <div key={endpoint.id} className="bg-card rounded-xl border p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">
                                            {endpoint.id.startsWith('admin_action') ? t('rateLimit.description.admin_actions') :
                                                endpoint.id.startsWith('create_link') ? t('rateLimit.description.create_link') :
                                                    endpoint.id.startsWith('create_vault') ? t('rateLimit.description.create_vault') :
                                                        endpoint.id === 'register' ? t('rateLimit.description.register') :
                                                            endpoint.id === 'login' ? t('rateLimit.description.login') :
                                                                endpoint.id === 'email_verification' ? t('rateLimit.description.email_verification') :
                                                                    endpoint.id === 'email_verification_confirm' ? t('rateLimit.description.email_verification_confirm') :
                                                                        t('rateLimit.description.forgot_password')}
                                        </h3>
                                        {isModified && (
                                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                {t('rateLimit.modified')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {endpoint.id.startsWith('admin_action') ? t('rateLimit.descriptionText.admin_actions') :
                                            endpoint.id.startsWith('create_link') ? t('rateLimit.descriptionText.create_link') :
                                                endpoint.id.startsWith('create_vault') ? t('rateLimit.descriptionText.create_vault') :
                                                    endpoint.id === 'register' ? t('rateLimit.descriptionText.register') :
                                                        endpoint.id === 'login' ? t('rateLimit.descriptionText.login') :
                                                            endpoint.id === 'email_verification' ? t('rateLimit.descriptionText.email_verification') :
                                                                endpoint.id === 'email_verification_confirm' ? t('rateLimit.descriptionText.email_verification_confirm') :
                                                                    t('rateLimit.descriptionText.forgot_password')}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Max attempts */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        <Clock className="w-4 h-4 inline mr-1.5" />
                                        {t('rateLimit.maxAttempts')}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            max="999999"
                                            value={endpoint.maxAttempts}
                                            onChange={(e) =>
                                                canEdit &&
                                                handleChange(endpoint.id, 'maxAttempts', parseInt(e.target.value) || 1)
                                            }
                                            disabled={!canEdit}
                                            className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        {endpoint.id === 'admin_action' && canEdit && (
                                            <button
                                                onClick={() => handleChange(endpoint.id, 'maxAttempts', endpoint.maxAttempts === 999999 ? 50 : 999999)}
                                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${endpoint.maxAttempts === 999999
                                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                                    : 'bg-muted hover:bg-accent'
                                                    }`}
                                                title={endpoint.maxAttempts === 999999 ? 'Activer la limite' : 'Désactiver la limite'}
                                            >
                                                {endpoint.maxAttempts === 999999 ? t('rateLimit.actionsActive') : t('rateLimit.actionsUnlimited')}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Window */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        <Clock className="w-4 h-4 inline mr-1.5" />
                                        {t('rateLimit.window')}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="1440"
                                        value={endpoint.windowMinutes}
                                        onChange={(e) =>
                                            canEdit &&
                                            handleChange(endpoint.id, 'windowMinutes', parseInt(e.target.value) || 1)
                                        }
                                        disabled={!canEdit}
                                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>

                                {/* Block duration */}
                                <div>
                                    <label className=" block text-sm font-medium mb-2">
                                        <Ban className="w-4 h-4 inline mr-1.5" />
                                        {t('rateLimit.blockDuration')}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="1440"
                                        value={endpoint.blockMinutes}
                                        onChange={(e) =>
                                            canEdit &&
                                            handleChange(endpoint.id, 'blockMinutes', parseInt(e.target.value) || 1)
                                        }
                                        disabled={!canEdit}
                                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                                {t('rateLimit.summaryText', {
                                    attempts: endpoint.maxAttempts.toString(),
                                    window: endpoint.windowMinutes.toString(),
                                    block: endpoint.blockMinutes.toString()
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
