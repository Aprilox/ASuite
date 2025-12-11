import { prisma } from '@asuite/database';

export interface SiteSettings {
  name: string;
  description: string;
}

// Cache pour éviter trop de requêtes DB
let cachedSettings: SiteSettings | null = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute

/**
 * Récupère les paramètres du site depuis la base de données
 * Avec mise en cache pour les performances
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const now = Date.now();
  
  // Utiliser le cache si disponible et valide
  if (cachedSettings && now - cacheTime < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['site.name', 'site.description'],
        },
      },
    });

    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    cachedSettings = {
      name: settingsMap['site.name'] || 'ASuite',
      description: settingsMap['site.description'] || 'Suite collaborative professionnelle',
    };
    cacheTime = now;

    return cachedSettings;
  } catch (error) {
    console.error('Error fetching site settings:', error);
    // Retourner les valeurs par défaut en cas d'erreur
    return {
      name: 'ASuite',
      description: 'Suite collaborative professionnelle',
    };
  }
}

/**
 * Invalide le cache des paramètres (à appeler après modification)
 */
export function invalidateSiteSettingsCache(): void {
  cachedSettings = null;
  cacheTime = 0;
}

