'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';
import { useAdmin } from '@/hooks/use-admin';
import {
  Settings,
  Shield,
  Mail,
  HardDrive,
  Loader2,
  Save,
  RefreshCw,
} from 'lucide-react';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
  label: string | null;
}

interface Category {
  id: string;
  icon: string;
}

const categoryIcons: Record<string, typeof Settings> = {
  general: Settings,
  security: Shield,
  email: Mail,
  storage: HardDrive,
};

export default function AdminSettingsPage() {
  const toast = useToast();
  const t = useTranslations('admin.settings');
  const { hasPermission } = useAdmin();
  
  // Permission de modifier les paramètres
  const canEdit = hasPermission('settings.edit');

  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Track changes
  const [changes, setChanges] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setCategories(data.categories);
      }
    } catch (error) {
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setChanges((prev) => ({ ...prev, [key]: value }));
  };

  const getValue = (setting: SystemSetting) => {
    return changes[setting.key] !== undefined ? changes[setting.key] : setting.value;
  };

  const handleSave = async () => {
    if (Object.keys(changes).length === 0) {
      toast.info(t('noChanges'));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: changes }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || t('saveSuccess'));
        setChanges({});
        fetchSettings();
      } else {
        const data = await res.json();
        toast.error(data.error || t('saveError'));
      }
    } catch (error) {
      toast.error(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setChanges({});
  };

  const categorySettings = settings.filter((s) => s.category === activeCategory);
  const hasChanges = Object.keys(changes).length > 0;

  const renderInput = (setting: SystemSetting) => {
    const value = getValue(setting);

    switch (setting.type) {
      case 'boolean':
        return (
          <label className={`relative inline-flex items-center ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
            <input
              type="checkbox"
              checked={value === 'true'}
              onChange={(e) => handleChange(setting.key, e.target.checked ? 'true' : 'false')}
              disabled={!canEdit}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50"></div>
          </label>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            disabled={!canEdit}
            className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          />
        );

      default:
        // Check if it's a password field
        if (setting.key.includes('password') || setting.key.includes('secret')) {
          return (
            <input
              type="password"
              value={value}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              disabled={!canEdit}
              placeholder="••••••••"
              className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            />
          );
        }
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            disabled={!canEdit}
            className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        {/* Boutons d'action - nécessite settings.edit */}
        {canEdit && (
          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent"
              >
                <RefreshCw className="w-4 h-4" />
                {t('reset')}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {t('save')}
            </button>
          </div>
        )}
      </div>

      {hasChanges && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {t('unsavedChanges', { count: Object.keys(changes).length })}
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Categories */}
        <div className="lg:w-64 shrink-0">
          <nav className="space-y-1">
            {categories.map((category) => {
              const Icon = categoryIcons[category.id] || Settings;
              const isActive = activeCategory === category.id;
              const categoryHasChanges = settings
                .filter((s) => s.category === category.id)
                .some((s) => changes[s.key] !== undefined);

              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{t(`categories.${category.id}`)}</span>
                  {categoryHasChanges && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings */}
        <div className="flex-1 bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-6">
            {t(`categories.${activeCategory}`)}
          </h2>

          {categorySettings.length === 0 ? (
            <p className="text-muted-foreground">{t('noSettings')}</p>
          ) : (
            <div className="space-y-6">
              {categorySettings.map((setting) => (
                <div key={setting.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      {setting.label || setting.key}
                    </label>
                    {changes[setting.key] !== undefined && (
                      <span className="text-xs text-amber-600">{t('modified')}</span>
                    )}
                  </div>
                  {renderInput(setting)}
                  <p className="text-xs text-muted-foreground">
                    {setting.key}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

