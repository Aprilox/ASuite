/**
 * Formate un nombre avec séparateurs de milliers
 * @param num - Nombre à formater
 * @returns Nombre formaté
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num);
}

/**
 * Formate une date relative (il y a X minutes, etc.)
 * @param date - Date à formater
 * @returns Date relative en français
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
  return target.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: target.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Formate une date complète
 * @param date - Date à formater
 * @returns Date formatée
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formate une date avec l'heure
 * @param date - Date à formater
 * @returns Date et heure formatées
 */
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formate une taille de fichier
 * @param bytes - Taille en octets
 * @returns Taille formatée (Ko, Mo, Go)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 o';
  
  const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Tronque un texte avec ellipsis
 * @param text - Texte à tronquer
 * @param maxLength - Longueur maximale
 * @returns Texte tronqué
 */
export function truncate(text: string, maxLength: number = 50): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Extrait le domaine d'une URL
 * @param url - URL complète
 * @returns Domaine
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url;
  }
}

