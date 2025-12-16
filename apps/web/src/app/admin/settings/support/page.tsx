'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Save, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface SupportSettings {
    ticketRateLimit: number;
    subjectMaxLength: number;
    messageMaxLength: number;
    creationEnabled: boolean;
}

export default function SupportSettingsPage() {
    const t = useTranslations('admin.settings');
    const [settings, setSettings] = useState<SupportSettings>({
        ticketRateLimit: 3,
        subjectMaxLength: 200,
        messageMaxLength: 10000,
        creationEnabled: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Charger les paramètres
    useEffect(() => {
        async function loadSettings() {
            try {
                const res = await fetch('/api/admin/settings?category=support');
                if (res.ok) {
                    const data = await res.json();
                    const settingsMap = Object.fromEntries(
                        data.settings.map((s: any) => [s.key.replace('support.', ''), s.value])
                    );

                    setSettings({
                        ticketRateLimit: parseInt(settingsMap.ticketRateLimit || '3'),
                        subjectMaxLength: parseInt(settingsMap.subjectMaxLength || '200'),
                        messageMaxLength: parseInt(settingsMap.messageMaxLength || '10000'),
                        creationEnabled: settingsMap.creationEnabled === 'true',
                    });
                }
            } catch (error) {
                console.error('Error loading support settings:', error);
                toast.error('Erreur lors du chargement des paramètres');
            } finally {
                setLoading(false);
            }
        }

        loadSettings();
    }, []);

    // Sauvegarder les paramètres
    async function handleSave() {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: 'support',
                    settings: [
                        { key: 'support.ticketRateLimit', value: settings.ticketRateLimit.toString(), type: 'number' },
                        { key: 'support.subjectMaxLength', value: settings.subjectMaxLength.toString(), type: 'number' },
                        { key: 'support.messageMaxLength', value: settings.messageMaxLength.toString(), type: 'number' },
                        { key: 'support.creationEnabled', value: settings.creationEnabled.toString(), type: 'boolean' },
                    ],
                }),
            });

            if (res.ok) {
                toast.success('Paramètres de support sauvegardés');
            } else {
                throw new Error('Save failed');
            }
        } catch (error) {
            console.error('Error saving support settings:', error);
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Shield className="w-8 h-8 text-primary" />
                <div>
                    <h1 className="text-2xl font-bold">Paramètres Support</h1>
                    <p className="text-sm text-muted-foreground">
                        Configuration du système de tickets et support client
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-card border rounded-lg p-6 space-y-6">
                {/* Création de tickets activée */}
                <div>
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium">Activer la création de tickets</label>
                            <p className="text-sm text-muted-foreground mt-1">
                                Permet aux utilisateurs de créer des tickets de support
                            </p>
                        </div>
                        <button
                            onClick={() => setSettings({ ...settings, creationEnabled: !settings.creationEnabled })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.creationEnabled ? 'bg-primary' : 'bg-muted'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.creationEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                <div className="border-t" />

                {/* Rate Limit */}
                <div>
                    <label className="font-medium">Tickets max par heure</label>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Nombre maximum de tickets qu'un utilisateur peut créer par heure
                    </p>
                    <input
                        type="number"
                        min="1"
                        max="100"
                        value={settings.ticketRateLimit}
                        onChange={(e) => setSettings({ ...settings, ticketRateLimit: parseInt(e.target.value) || 1 })}
                        className="px-3 py-2 rounded-lg border bg-background w-32"
                    />
                    <span className="ml-2 text-sm text-muted-foreground">tickets/heure</span>
                </div>

                {/* Longueur max sujet */}
                <div>
                    <label className="font-medium">Longueur maximale du sujet</label>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Nombre maximum de caractères pour le sujet d'un ticket
                    </p>
                    <input
                        type="number"
                        min="50"
                        max="500"
                        value={settings.subjectMaxLength}
                        onChange={(e) => setSettings({ ...settings, subjectMaxLength: parseInt(e.target.value) || 50 })}
                        className="px-3 py-2 rounded-lg border bg-background w-32"
                    />
                    <span className="ml-2 text-sm text-muted-foreground">caractères</span>
                </div>

                {/* Longueur max message */}
                <div>
                    <label className="font-medium">Longueur maximale du message</label>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Nombre maximum de caractères pour un message de ticket
                    </p>
                    <input
                        type="number"
                        min="100"
                        max="50000"
                        step="1000"
                        value={settings.messageMaxLength}
                        onChange={(e) => setSettings({ ...settings, messageMaxLength: parseInt(e.target.value) || 100 })}
                        className="px-3 py-2 rounded-lg border bg-background w-32"
                    />
                    <span className="ml-2 text-sm text-muted-foreground">caractères</span>
                </div>

                {/* Bouton Sauvegarder */}
                <div className="border-t pt-6">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sauvegarde...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Sauvegarder
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
