import { NextResponse } from 'next/server';
import { getCsrfToken } from '@/lib/csrf';

/**
 * GET /api/csrf - Obtenir un token CSRF
 */
export async function GET() {
    try {
        const token = await getCsrfToken();

        return NextResponse.json({ token });
    } catch (error) {
        console.error('CSRF token generation error:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la génération du token' },
            { status: 500 }
        );
    }
}
