'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Lock,
  ArrowLeft,
  Calendar,
  Flame,
  AlertTriangle,
  Eye,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

// Utilitaires de déchiffrement côté client
async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

async function decryptContent(encrypted: string, iv: string, key: CryptoKey): Promise<string> {
  const encryptedData = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const ivData = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivData },
    key,
    encryptedData
  );
  
  return new TextDecoder().decode(decrypted);
}

// Flag global pour éviter les doubles appels (React Strict Mode)
const fetchingVaults = new Set<string>();

export default function VaultViewPage() {
  const params = useParams();
  const code = params.code as string;
  const t = useTranslations('avault.viewNote');
  const tCommon = useTranslations('common');
  const toast = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [burnedAfterRead, setBurnedAfterRead] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Clé unique incluant le hash (clé de déchiffrement) pour différencier les sessions
    const keyString = window.location.hash.slice(1);
    const storageKey = `vault_${code}_${keyString.substring(0, 10)}`;
    
    // Vérifier si un fetch est déjà en cours pour ce code (protection Strict Mode)
    if (fetchingVaults.has(storageKey)) {
      // Attendre que le premier fetch termine et utiliser le cache
      const checkCache = setInterval(() => {
        const cached = sessionStorage.getItem(storageKey);
        if (cached) {
          clearInterval(checkCache);
          try {
            const data = JSON.parse(cached);
            setContent(data.content);
            setTitle(data.title);
            setCreatedAt(data.createdAt);
            setBurnedAfterRead(data.burnedAfterRead);
            setIsLoading(false);
          } catch {
            setError(t('cacheError'));
            setIsLoading(false);
          }
        }
      }, 50);
      // Timeout après 5 secondes
      setTimeout(() => clearInterval(checkCache), 5000);
      return;
    }
    
    // Marquer comme en cours de fetch
    fetchingVaults.add(storageKey);
    
    // Nettoyer après 3 secondes
    setTimeout(() => {
      fetchingVaults.delete(storageKey);
    }, 3000);
    
    fetchNote(undefined, storageKey);
  }, [code]);

  const fetchNote = async (pwd?: string, storageKey?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Récupérer la clé de déchiffrement depuis le fragment d'URL
      const keyString = window.location.hash.slice(1);
      
      if (!keyString) {
        setError(t('notFound'));
        setIsLoading(false);
        return;
      }
      
      // Calculer la clé de cache si non fournie
      const cacheKey = storageKey || `vault_${code}_${keyString.substring(0, 10)}`;
      
      const url = pwd ? `/api/vault/${code}?password=${encodeURIComponent(pwd)}` : `/api/vault/${code}`;
      const res = await fetch(url);
      const data = await res.json();
      
      // Vérifier si mot de passe requis
      if (data.requiresPassword) {
        setRequiresPassword(true);
        setIsLoading(false);
        return;
      }
      
      // Vérifier si mot de passe incorrect
      if (data.wrongPassword) {
        setError(t('wrongPassword'));
        setIsLoading(false);
        return;
      }
      
      if (res.status === 404) {
        setError(t('notFound'));
        setIsLoading(false);
        return;
      }
      
      if (res.status === 410) {
        setError(data.error === 'Cette note a expiré' ? t('expired') : t('limitReached'));
        setIsLoading(false);
        return;
      }
      
      if (!res.ok) {
        setError(tCommon('error'));
        setIsLoading(false);
        return;
      }
      
      // Déchiffrer le contenu
      try {
        const key = await importKey(keyString);
        const decrypted = await decryptContent(data.content, data.iv, key);
        setContent(decrypted);
        setTitle(data.title);
        setCreatedAt(data.createdAt);
        setBurnedAfterRead(data.burnAfterRead);
        
        // Sauvegarder en session pour éviter les doubles appels (sauf burn after read)
        if (!data.burnAfterRead) {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            content: decrypted,
            title: data.title,
            createdAt: data.createdAt,
            burnedAfterRead: data.burnAfterRead,
          }));
        }
      } catch {
        setError(t('decryptError'));
      }
    } catch (err) {
      setError(tCommon('error'));
      console.error('Error fetching vault:', err);
    } finally {
      setIsLoading(false);
      setIsVerifying(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    fetchNote(password);
  };

  const copyContent = async () => {
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success(tCommon('copied'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-muted-foreground">{t('decrypting')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-card rounded-2xl border p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-xl font-bold mb-2">{error}</h1>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {tCommon('backHome')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Password required
  if (requiresPassword && !content) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-card rounded-2xl border p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h1 className="text-xl font-bold mb-2">{t('passwordRequired')}</h1>
              <p className="text-muted-foreground text-sm">{t('enterPassword')}</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                autoComplete="off"
                className="w-full h-12 px-4 rounded-xl border border-input bg-background text-center text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={isVerifying || !password}
                className="w-full h-12 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('unlocking')}
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    {t('unlock')}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Content display
  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {tCommon('backHome')}
          </Link>
          <button
            onClick={copyContent}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-lg border border-input bg-background hover:bg-accent text-sm font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                {tCommon('copied')}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                {tCommon('copy')}
              </>
            )}
          </button>
        </div>

        {/* Burned after read warning */}
        {burnedAfterRead && (
          <div className="mb-6 p-4 rounded-xl bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 flex items-center gap-3">
            <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0" />
            <div>
              <p className="font-medium text-orange-800 dark:text-orange-200">{t('burnedTitle')}</p>
              <p className="text-sm text-orange-700 dark:text-orange-300">{t('burned')}</p>
            </div>
          </div>
        )}

        {/* Note Card */}
        <div className="bg-card rounded-2xl border overflow-hidden">
          {/* Title */}
          {title && (
            <div className="px-6 py-4 border-b bg-muted/30">
              <h1 className="text-xl font-bold flex items-center gap-3">
                <Lock className="w-5 h-5 text-purple-500" />
                {title}
              </h1>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {content}
            </pre>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-muted/30 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Lock className="w-4 h-4 text-green-600" />
              {t('secureNote')}
            </span>
            {createdAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {t('createdAt')}: {formatDate(createdAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
