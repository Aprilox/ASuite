import { nanoid, customAlphabet } from 'nanoid';

// Alphabet sans caractères ambigus (0, O, l, I)
const SAFE_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';

// Générateur de codes courts
const generateShortCode = customAlphabet(SAFE_ALPHABET, 7);

/**
 * Génère un code court unique pour les liens
 * @param length - Longueur du code (défaut: 7)
 * @returns Code court alphanumérique
 */
export function createShortCode(length: number = 7): string {
  if (length < 4) length = 4;
  if (length > 20) length = 20;
  
  const generator = customAlphabet(SAFE_ALPHABET, length);
  return generator();
}

/**
 * Génère un ID unique
 * @returns ID unique de 21 caractères
 */
export function createUniqueId(): string {
  return nanoid();
}

/**
 * Vérifie si un code court est valide
 * @param code - Code à vérifier
 * @returns true si le code est valide
 */
export function isValidShortCode(code: string): boolean {
  if (!code || code.length < 3 || code.length > 50) return false;
  // Autorise lettres, chiffres, tirets et underscores
  return /^[a-zA-Z0-9_-]+$/.test(code);
}

/**
 * Normalise un code court personnalisé
 * @param code - Code à normaliser
 * @returns Code normalisé ou null si invalide
 */
export function normalizeShortCode(code: string): string | null {
  if (!code) return null;
  
  // Supprime les espaces et caractères spéciaux
  const normalized = code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  
  // Supprime les tirets multiples
  const cleaned = normalized.replace(/-+/g, '-').replace(/^-|-$/g, '');
  
  if (!isValidShortCode(cleaned)) return null;
  
  return cleaned;
}

