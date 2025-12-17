/**
 * Global Rate Limiting System - Modulaire et configurable
 * 
 * Protège tous les endpoints API avec des limites configurables via l'admin.
 * Les limites sont stockées en base de données et mises en cache.
 */

import { prisma } from '@asuite/database';

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blocked: boolean;
  blockedUntil?: number;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

// Cache de configuration (rafraîchi toutes les 60 secondes)
const configCache = new Map<string, RateLimitConfig>();
let configLastFetched = 0;
const CONFIG_CACHE_MS = 60 * 1000;

// Stockage des tentatives en mémoire (par IP ou par userId)
const attemptStore = new Map<string, RateLimitEntry>();

// Nettoyage périodique des entrées expirées
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attemptStore.entries()) {
    if (entry.blocked && entry.blockedUntil && now > entry.blockedUntil) {
      attemptStore.delete(key);
    } else if (!entry.blocked && now - entry.firstAttempt > 3600000) { // 1 heure
      attemptStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Toutes les 5 minutes

/**
 * Charger la configuration de rate limiting depuis la DB
 */
async function loadRateLimitConfig(endpoint: string): Promise<RateLimitConfig> {
  const now = Date.now();
  const cacheKey = `ratelimit.${endpoint}`;

  // Vérifier le cache
  if (now - configLastFetched < CONFIG_CACHE_MS && configCache.has(cacheKey)) {
    return configCache.get(cacheKey)!;
  }

  try {
    // Charger les paramètres spécifiques à l'endpoint
    const settings = await prisma.systemSetting.findMany({
      where: {
        OR: [
          { key: `ratelimit.${endpoint}.max_attempts` },
          { key: `ratelimit.${endpoint}.window_minutes` },
          { key: `ratelimit.${endpoint}.block_minutes` },
        ],
      },
    });

    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    const config: RateLimitConfig = {
      maxAttempts: parseInt(settingsMap[`ratelimit.${endpoint}.max_attempts`] || '20', 10),
      windowMs: parseInt(settingsMap[`ratelimit.${endpoint}.window_minutes`] || '60', 10) * 60 * 1000,
      blockDurationMs: parseInt(settingsMap[`ratelimit.${endpoint}.block_minutes`] || '15', 10) * 60 * 1000,
    };

    configCache.set(cacheKey, config);
    configLastFetched = now;

    return config;
  } catch (error) {
    console.error('Error loading rate limit config:', error);
    // Configuration par défaut en cas d'erreur
    return {
      maxAttempts: 20,
      windowMs: 60 * 60 * 1000, // 1 heure
      blockDurationMs: 15 * 60 * 1000, // 15 minutes
    };
  }
}

/**
 * Obtenir ou créer une entrée de rate limiting
 */
function getOrCreateEntry(key: string, windowMs: number): RateLimitEntry {
  const existing = attemptStore.get(key);
  const now = Date.now();

  if (!existing) {
    const entry: RateLimitEntry = { count: 0, firstAttempt: now, blocked: false };
    attemptStore.set(key, entry);
    return entry;
  }

  // Reset si la fenêtre est expirée et pas bloqué
  if (!existing.blocked && now - existing.firstAttempt > windowMs) {
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
 * Vérifier le rate limiting pour un endpoint donné
 * 
 * @param endpoint - Nom de l'endpoint (ex: 'register', 'create_link', 'admin_action')
 * @param identifier - Identifiant unique (IP ou userId)
 * @returns Résultat de la vérification
 */
export async function checkGlobalRateLimit(
  endpoint: string,
  identifier: string
): Promise<RateLimitResult> {
  const config = await loadRateLimitConfig(endpoint);
  const key = `${endpoint}:${identifier}`;
  const now = Date.now();

  const entry = getOrCreateEntry(key, config.windowMs);

  // Vérifier si bloqué
  if (entry.blocked && entry.blockedUntil) {
    const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
    return {
      allowed: false,
      reason: `Trop de tentatives. Réessayez dans ${Math.ceil(retryAfter / 60)} minute(s).`,
      retryAfter: retryAfter > 0 ? retryAfter : 1,
    };
  }

  // Vérifier si le seuil est DÉJÀ atteint AVANT d'incrémenter
  if (entry.count >= config.maxAttempts) {
    entry.blocked = true;
    entry.blockedUntil = now + config.blockDurationMs;

    const retryAfter = Math.ceil(config.blockDurationMs / 1000);
    return {
      allowed: false,
      reason: `Trop de tentatives. Réessayez dans ${Math.ceil(retryAfter / 60)} minute(s).`,
      retryAfter,
    };
  }

  // Si pas encore au max, incrémenter et autoriser
  entry.count++;
  return { allowed: true };
}

/**
 * Enregistrer une tentative (succès ou échec)
 * 
 * @param endpoint - Nom de l'endpoint
 * @param identifier - Identifiant unique (IP ou userId)
 * @param success - True si succès, False si échec
 */
export async function recordRateLimitAttempt(
  endpoint: string,
  identifier: string,
  success: boolean
): Promise<void> {
  const config = await loadRateLimitConfig(endpoint);
  const key = `${endpoint}:${identifier}`;
  const now = Date.now();

  // En cas de succès, on peut choisir de ne pas reseter le compteur
  // pour éviter qu'un attaquant utilise un succès pour contourner le rate limit
  if (success) {
    return;
  }

  // Enregistrer l'échec
  const entry = getOrCreateEntry(key, config.windowMs);
  entry.count++;

  // Bloquer si le seuil est atteint
  if (entry.count >= config.maxAttempts) {
    entry.blocked = true;
    entry.blockedUntil = now + config.blockDurationMs;
  }
}

/**
 * Réinitialiser le rate limiting pour un identifiant (admin override)
 */
export function resetRateLimit(endpoint: string, identifier: string): void {
  const key = `${endpoint}:${identifier}`;
  attemptStore.delete(key);
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
