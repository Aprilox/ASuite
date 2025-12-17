/**
 * CSRF Protection System
 * 
 * Génère et valide des tokens CSRF pour protéger contre les attaques Cross-Site Request Forgery
 */

import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Génère un token CSRF aléatoire cryptographiquement sécurisé
 */
export function generateCsrfToken(): string {
    return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Récupère ou crée un token CSRF depuis les cookies
 */
export async function getCsrfToken(): Promise<string> {
    const cookieStore = await cookies();
    let token = cookieStore.get(CSRF_COOKIE_NAME)?.value;

    if (!token) {
        token = generateCsrfToken();
        cookieStore.set(CSRF_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24, // 24 heures
        });
    }

    return token;
}

/**
 * Valide un token CSRF depuis les headers de la requête
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    if (!cookieToken || !headerToken) {
        return false;
    }

    // Comparaison sécurisée contre les timing attacks
    return timingSafeEqual(cookieToken, headerToken);
}

/**
 * Comparaison timing-safe de deux strings
 */
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
}

/**
 * Middleware pour vérifier le token CSRF sur les mutations (POST, PUT, DELETE, PATCH)
 */
export async function requireCsrfToken(request: Request): Promise<void> {
    const method = request.method.toUpperCase();

    // Vérifier uniquement pour les mutations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        const isValid = await validateCsrfToken(request);

        if (!isValid) {
            throw new Error('Invalid CSRF token');
        }
    }
}

/**
 * Endpoint API pour obtenir un token CSRF (côté client)
 */
export async function getTokenForClient(): Promise<{ token: string }> {
    const token = await getCsrfToken();
    return { token };
}
