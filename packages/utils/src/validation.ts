/**
 * Vérifie si une URL est valide
 * @param url - URL à vérifier
 * @returns true si l'URL est valide
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Vérifie si une URL est sécurisée (HTTPS)
 * @param url - URL à vérifier
 * @returns true si l'URL utilise HTTPS
 */
export function isSecureUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Vérifie si un email est valide
 * @param email - Email à vérifier
 * @returns true si l'email est valide
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Vérifie la force d'un mot de passe
 * @param password - Mot de passe à vérifier
 * @returns Score de 0 à 4 et messages d'erreur
 */
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return { score: 0, feedback: ['Le mot de passe est requis'] };
  }

  // Longueur
  if (password.length >= 8) score++;
  else feedback.push('Au moins 8 caractères requis');

  if (password.length >= 12) score++;

  // Complexité
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else feedback.push('Majuscules et minuscules requises');

  if (/\d/.test(password)) score++;
  else feedback.push('Au moins un chiffre requis');

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else feedback.push('Au moins un caractère spécial recommandé');

  return { score: Math.min(score, 4), feedback };
}

/**
 * Nettoie et valide une entrée utilisateur
 * @param input - Entrée à nettoyer
 * @param maxLength - Longueur maximale
 * @returns Entrée nettoyée
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input) return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Supprime les balises HTML basiques
}

