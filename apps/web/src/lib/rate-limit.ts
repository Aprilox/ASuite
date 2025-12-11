/**
 * Rate Limiting - Protection anti brute-force
 * Bloque par IP uniquement (pas par email pour éviter le DoS sur les utilisateurs légitimes)
 * TODO: Ajouter CAPTCHA après N tentatives
 */

import { prisma } from '@asuite/database';

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blocked: boolean;
  blockedUntil?: number;
}

// Configuration par défaut (sera surchargée par les paramètres DB)
let RATE_LIMIT_CONFIG = {
  maxAttemptsByIp: 10,      // Max tentatives par IP en 15 minutes
  windowMs: 15 * 60 * 1000, // Fenêtre de 15 minutes
  blockDurationMs: 15 * 60 * 1000, // Blocage de 15 minutes
};

// Cache pour les paramètres (évite de requêter la DB à chaque appel)
let configLastFetched = 0;
const CONFIG_CACHE_MS = 60 * 1000; // 1 minute

/**
 * Charge les paramètres de sécurité depuis la base de données
 */
async function loadSecurityConfig(): Promise<void> {
  const now = Date.now();
  if (now - configLastFetched < CONFIG_CACHE_MS) {
    return; // Utiliser le cache
  }

  try {
    const settings = await prisma.systemSetting.findMany({
      where: { category: 'security' },
    });

    const config: Record<string, string> = {};
    for (const s of settings) {
      config[s.key] = s.value;
    }

    const maxAttempts = parseInt(config['security.max_login_attempts'] || '10', 10);
    const lockoutMinutes = parseInt(config['security.lockout_duration'] || '15', 10);

    RATE_LIMIT_CONFIG = {
      maxAttemptsByIp: maxAttempts > 0 ? maxAttempts : 10,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: lockoutMinutes > 0 ? lockoutMinutes * 60 * 1000 : 15 * 60 * 1000,
    };

    configLastFetched = now;
  } catch (error) {
    console.error('Error loading security config:', error);
  }
}

// Stockage en mémoire (par IP uniquement)
const ipAttempts = new Map<string, RateLimitEntry>();

// Nettoyage périodique des entrées expirées (toutes les 5 minutes)
setInterval(() => {
  const now = Date.now();
  
  for (const [key, entry] of ipAttempts.entries()) {
    if (entry.blocked && entry.blockedUntil && now > entry.blockedUntil) {
      ipAttempts.delete(key);
    } else if (!entry.blocked && now - entry.firstAttempt > RATE_LIMIT_CONFIG.windowMs) {
      ipAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000);

function getOrCreateEntry(ip: string): RateLimitEntry {
  const existing = ipAttempts.get(ip);
  const now = Date.now();
  
  if (!existing) {
    const entry: RateLimitEntry = { count: 0, firstAttempt: now, blocked: false };
    ipAttempts.set(ip, entry);
    return entry;
  }
  
  // Reset si la fenêtre est expirée et pas bloqué
  if (!existing.blocked && now - existing.firstAttempt > RATE_LIMIT_CONFIG.windowMs) {
    existing.count = 0;
    existing.firstAttempt = now;
  }
  
  // Débloquer si le temps de blocage est passé
  if (existing.blocked && existing.blockedUntil && now > existing.blockedUntil) {
    existing.blocked = false;
    existing.blockedUntil = undefined;
    existing.count = 0;
    existing.firstAttempt = now;
  }
  
  return existing;
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number; // Secondes avant de pouvoir réessayer
}

/**
 * Vérifie si une tentative de login est autorisée (basé sur l'IP uniquement)
 */
export async function checkRateLimit(email: string, ip: string): Promise<RateLimitResult> {
  // Charger la config depuis la DB (avec cache)
  await loadSecurityConfig();
  
  const now = Date.now();
  
  // Vérifier le blocage par IP uniquement
  const ipEntry = getOrCreateEntry(ip);
  if (ipEntry.blocked && ipEntry.blockedUntil) {
    const retryAfter = Math.ceil((ipEntry.blockedUntil - now) / 1000);
    return {
      allowed: false,
      reason: 'Trop de tentatives. Réessayez plus tard.',
      retryAfter: retryAfter > 0 ? retryAfter : 1,
    };
  }
  
  return { allowed: true };
}

/**
 * Enregistre une tentative de login (succès ou échec)
 */
export async function recordLoginAttempt(email: string, ip: string, success: boolean): Promise<void> {
  // Charger la config depuis la DB (avec cache)
  await loadSecurityConfig();
  
  const now = Date.now();
  
  // En cas de succès, on ne reset PAS le compteur IP
  // pour éviter qu'un attaquant utilise un compte valide pour contourner le rate limit
  if (success) {
    return;
  }
  
  // Enregistrer l'échec pour l'IP
  const ipEntry = getOrCreateEntry(ip);
  ipEntry.count++;
  
  if (ipEntry.count >= RATE_LIMIT_CONFIG.maxAttemptsByIp) {
    ipEntry.blocked = true;
    ipEntry.blockedUntil = now + RATE_LIMIT_CONFIG.blockDurationMs;
  }
}

/**
 * Obtenir l'IP du client depuis les headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}
