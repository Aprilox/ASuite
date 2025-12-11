'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';
import { useAdmin } from '@/hooks/use-admin';
import {
  Settings,
  Shield,
  Mail,
  Loader2,
  Save,
  RotateCcw,
  ChevronRight,
  AlertCircle,
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
};

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  general: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' },
  security: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30' },
  email: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30' },
};

export default function AdminSettingsPage() {
  const toast = useToast();
  const t = useTranslations('admin.settings');
  const { hasPermission } = useAdmin();
  
  const canEdit = hasPermission('settings.edit');

  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const categorySettings = activeCategory 
    ? settings.filter((s) => s.category === activeCategory)
    : [];
  const hasChanges = Object.keys(changes).length > 0;

  const getSettingsCount = (categoryId: string) => {
    return settings.filter((s) => s.category === categoryId).length;
  };

  const getCategoryChangesCount = (categoryId: string) => {
    return settings
      .filter((s) => s.category === categoryId)
      .filter((s) => changes[s.key] !== undefined).length;
  };

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
            className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
        );

      default:
        if (setting.key.includes('password') || setting.key.includes('secret')) {
          return (
            <input
              type="password"
              value={value}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              disabled={!canEdit}
              placeholder="••••••••"
              className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
          );
        }
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            disabled={!canEdit}
            className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        {canEdit && hasChanges && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border hover:bg-accent transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">{t('reset')}</span>
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
              {t('save')}
            </button>
          </div>
        )}
      </div>

      {/* Unsaved changes alert */}
      {hasChanges && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {t('unsavedChanges', { count: Object.keys(changes).length })}
          </p>
        </div>
      )}

      {/* Category selection or settings view */}
      {!activeCategory ? (
        /* Categories Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((category) => {
            const Icon = categoryIcons[category.id] || Settings;
            const colors = categoryColors[category.id] || categoryColors.general;
            const settingsCount = getSettingsCount(category.id);
            const changesCount = getCategoryChangesCount(category.id);

            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`group relative flex items-center gap-4 p-5 rounded-xl border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all text-left`}
              >
                <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {t(`categories.${category.id}`)}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {settingsCount} {settingsCount > 1 ? t('settingsPlural') : t('settingsSingular')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {changesCount > 0 && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      {changesCount}
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Settings panel */
        <div className="space-y-4">
          {/* Back button */}
          <button
            onClick={() => setActiveCategory(null)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            {t('backToCategories')}
          </button>

          {/* Category header */}
          <div className="flex items-center gap-4">
            {(() => {
              const Icon = categoryIcons[activeCategory] || Settings;
              const colors = categoryColors[activeCategory] || categoryColors.general;
              return (
                <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
              );
            })()}
            <div>
              <h2 className="text-xl font-semibold">{t(`categories.${activeCategory}`)}</h2>
              <p className="text-sm text-muted-foreground">
                {categorySettings.length} {categorySettings.length > 1 ? t('settingsPlural') : t('settingsSingular')}
              </p>
            </div>
          </div>

          {/* Settings list */}
          <div className="bg-card rounded-xl border divide-y">
            {categorySettings.length === 0 ? (
              <div className="p-8 text-center">
                <Settings className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">{t('noSettings')}</p>
              </div>
            ) : (
              categorySettings.map((setting) => {
                const isModified = changes[setting.key] !== undefined;
                // Try to get translation for the setting key, fallback to label or key
                const settingKey = setting.key.replace(/\./g, '_');
                let displayLabel = setting.label || setting.key;
                try {
                  const translated = t(`settingLabels.${settingKey}`);
                  if (translated && !translated.startsWith('settingLabels.')) {
                    displayLabel = translated;
                  }
                } catch {
                  // Use fallback
                }
                
                return (
                  <div key={setting.id} className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <label className="font-medium">
                            {displayLabel}
                          </label>
                          {isModified && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              {t('modified')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="sm:w-64 shrink-0">
                        {renderInput(setting)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
