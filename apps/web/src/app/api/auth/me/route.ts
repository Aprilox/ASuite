import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSession();

    // Retourner null si pas connecté (pas de 401 pour éviter les erreurs console)
    if (!user) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      theme: user.theme,
      locale: user.locale,
    });
  } catch (error) {
    console.error('Error checking auth:', error);
    return NextResponse.json(null);
  }
}

