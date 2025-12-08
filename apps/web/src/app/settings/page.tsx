'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useTheme } from '@/providers/theme-provider';
import {
  User,
  Lock,
  Bell,
  Palette,
  Shield,
  Trash2,
  Loader2,
  Save,
  Eye,
  EyeOff,
  Check,
  X,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/settings');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        toast.success('Profil mis à jour avec succès');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password validation
  const passwordChecks = [
    { label: 'Au moins 8 caractères', valid: newPassword.length >= 8 },
    { label: 'Une majuscule', valid: /[A-Z]/.test(newPassword) },
    { label: 'Une minuscule', valid: /[a-z]/.test(newPassword) },
    { label: 'Un chiffre', valid: /\d/.test(newPassword) },
  ];

  const isNewPasswordValid = passwordChecks.every((check) => check.valid);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isNewPasswordValid) {
      toast.error('Le mot de passe ne respecte pas les critères requis');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setIsSavingPassword(true);

    try {
      const res = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        toast.success('Mot de passe modifié avec succès');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirm({
      title: 'Supprimer votre compte',
      message: 'Cette action est irréversible. Toutes vos données, liens et statistiques seront définitivement supprimés.',
      confirmText: 'Supprimer mon compte',
      cancelText: 'Annuler',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await fetch('/api/auth/account', { method: 'DELETE' });

      if (res.ok) {
        toast.success('Compte supprimé');
        await logout();
        router.push('/');
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User, available: true },
    { id: 'security', label: 'Sécurité', icon: Lock, available: true },
    { id: 'notifications', label: 'Notifications', icon: Bell, available: false },
    { id: 'appearance', label: 'Apparence', icon: Palette, available: true },
    { id: 'danger', label: 'Zone de danger', icon: Shield, available: true },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Paramètres</h1>
              <p className="text-muted-foreground">
                Gérez votre compte et vos préférences
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Tabs */}
              <div className="lg:w-64 shrink-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const isDisabled = !tab.available;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => tab.available && setActiveTab(tab.id)}
                        disabled={isDisabled}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : isDisabled
                            ? 'text-muted-foreground/50 cursor-not-allowed'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isDisabled ? 'opacity-50' : ''}`} />
                        <span className="flex-1 text-left">{tab.label}</span>
                        {isDisabled && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            Bientôt
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Content */}
              <div className="flex-1">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="bg-card rounded-xl border p-6">
                    <h2 className="text-lg font-semibold mb-6">Informations du profil</h2>
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div>
                        <label htmlFor="name" className="text-sm font-medium mb-2 block">
                          Nom d'affichage
                        </label>
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Votre nom"
                          className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="text-sm font-medium mb-2 block">
                          Adresse email
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          disabled
                          className="w-full h-11 px-4 rounded-lg border border-input bg-muted text-sm text-muted-foreground cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          L'email ne peut pas être modifié pour le moment
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {isSavingProfile ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Enregistrer
                      </button>
                    </form>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="bg-card rounded-xl border p-6">
                    <h2 className="text-lg font-semibold mb-6">Changer le mot de passe</h2>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label htmlFor="current-password" className="text-sm font-medium mb-2 block">
                          Mot de passe actuel
                        </label>
                        <div className="relative">
                          <input
                            id="current-password"
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className="w-full h-11 px-4 pr-12 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="new-password" className="text-sm font-medium mb-2 block">
                          Nouveau mot de passe
                        </label>
                        <div className="relative">
                          <input
                            id="new-password"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="w-full h-11 px-4 pr-12 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {newPassword && (
                          <div className="mt-2 space-y-1">
                            {passwordChecks.map((check) => (
                              <div
                                key={check.label}
                                className={`flex items-center gap-2 text-xs ${
                                  check.valid ? 'text-green-600' : 'text-muted-foreground'
                                }`}
                              >
                                {check.valid ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <X className="w-3 h-3" />
                                )}
                                {check.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label htmlFor="confirm-password" className="text-sm font-medium mb-2 block">
                          Confirmer le mot de passe
                        </label>
                        <input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {confirmPassword && newPassword && (
                          <div className="flex items-center gap-1 mt-1">
                            {confirmPassword === newPassword ? (
                              <>
                                <Check className="w-4 h-4 text-green-500" />
                                <span className="text-xs text-green-500">Les mots de passe correspondent</span>
                              </>
                            ) : (
                              <span className="text-xs text-red-500">Les mots de passe ne correspondent pas</span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={isSavingPassword || !currentPassword || !isNewPasswordValid || newPassword !== confirmPassword}
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {isSavingPassword ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                        Changer le mot de passe
                      </button>
                    </form>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="bg-card rounded-xl border p-6 opacity-60">
                    <div className="flex items-center gap-2 mb-6">
                      <h2 className="text-lg font-semibold">Préférences de notifications</h2>
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        Bientôt disponible
                      </span>
                    </div>
                    <div className="space-y-4 pointer-events-none">
                      <div className="flex items-center justify-between py-3 border-b">
                        <div>
                          <p className="font-medium text-muted-foreground">Notifications par email</p>
                          <p className="text-sm text-muted-foreground/70">Recevoir des emails pour les mises à jour importantes</p>
                        </div>
                        <div className="relative w-12 h-7 rounded-full bg-muted">
                          <span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white/50 shadow" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b">
                        <div>
                          <p className="font-medium text-muted-foreground">Rapports hebdomadaires</p>
                          <p className="text-sm text-muted-foreground/70">Recevoir un résumé de vos statistiques chaque semaine</p>
                        </div>
                        <div className="relative w-12 h-7 rounded-full bg-muted">
                          <span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white/50 shadow" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium text-muted-foreground">Alertes de sécurité</p>
                          <p className="text-sm text-muted-foreground/70">Être notifié des connexions suspectes</p>
                        </div>
                        <div className="relative w-12 h-7 rounded-full bg-muted">
                          <span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white/50 shadow" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                  <div className="bg-card rounded-xl border p-6">
                    <h2 className="text-lg font-semibold mb-6">Apparence</h2>
                    <div className="space-y-6">
                      <div>
                        <p className="font-medium mb-4">Thème</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Choisissez le thème de l'interface. Le thème "Système" s'adapte automatiquement aux préférences de votre appareil.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* Light Theme */}
                          <button
                            onClick={() => setTheme('light')}
                            className={`relative p-4 rounded-xl border-2 transition-all ${
                              theme === 'light'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50 hover:bg-accent'
                            }`}
                          >
                            {theme === 'light' && (
                              <div className="absolute top-2 right-2">
                                <Check className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            <div className="w-full aspect-video bg-white rounded-lg mb-3 border flex items-center justify-center">
                              <Sun className="w-8 h-8 text-amber-500" />
                            </div>
                            <p className="font-medium text-sm">Clair</p>
                          </button>

                          {/* Dark Theme */}
                          <button
                            onClick={() => setTheme('dark')}
                            className={`relative p-4 rounded-xl border-2 transition-all ${
                              theme === 'dark'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50 hover:bg-accent'
                            }`}
                          >
                            {theme === 'dark' && (
                              <div className="absolute top-2 right-2">
                                <Check className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            <div className="w-full aspect-video bg-gray-900 rounded-lg mb-3 border border-gray-700 flex items-center justify-center">
                              <Moon className="w-8 h-8 text-blue-400" />
                            </div>
                            <p className="font-medium text-sm">Sombre</p>
                          </button>

                          {/* System Theme */}
                          <button
                            onClick={() => setTheme('system')}
                            className={`relative p-4 rounded-xl border-2 transition-all ${
                              theme === 'system'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50 hover:bg-accent'
                            }`}
                          >
                            {theme === 'system' && (
                              <div className="absolute top-2 right-2">
                                <Check className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            <div className="w-full aspect-video bg-gradient-to-r from-white to-gray-900 rounded-lg mb-3 border flex items-center justify-center">
                              <Monitor className="w-8 h-8 text-gray-500" />
                            </div>
                            <p className="font-medium text-sm">Système</p>
                          </button>
                        </div>
                      </div>

                      {/* Current theme info */}
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Thème actuel :</span>{' '}
                          {theme === 'system' ? (
                            <>Système ({resolvedTheme === 'dark' ? 'Sombre' : 'Clair'})</>
                          ) : theme === 'dark' ? (
                            'Sombre'
                          ) : (
                            'Clair'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Danger Zone Tab */}
                {activeTab === 'danger' && (
                  <div className="bg-card rounded-xl border border-red-200 dark:border-red-900 p-6">
                    <h2 className="text-lg font-semibold text-red-600 mb-2">Zone de danger</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      Ces actions sont irréversibles. Procédez avec prudence.
                    </p>
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-red-600">Supprimer mon compte</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Supprime définitivement votre compte et toutes les données associées (liens, statistiques, etc.)
                            </p>
                          </div>
                          <button
                            onClick={handleDeleteAccount}
                            className="shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

