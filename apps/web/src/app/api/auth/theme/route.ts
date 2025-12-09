import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { getSession } from '@/lib/auth';

const VALID_THEMES = ['light', 'dark', 'system'];

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { theme } = body;

    if (!theme || !VALID_THEMES.includes(theme)) {
      return NextResponse.json(
        { error: 'Thème invalide. Valeurs acceptées: light, dark, system' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { theme },
    });

    return NextResponse.json({ success: true, theme });
  } catch (error) {
    console.error('Error updating theme:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du thème' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ theme: 'light' });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { theme: true },
    });

    return NextResponse.json({ theme: dbUser?.theme || 'light' });
  } catch (error) {
    console.error('Error getting theme:', error);
    return NextResponse.json({ theme: 'light' });
  }
}



