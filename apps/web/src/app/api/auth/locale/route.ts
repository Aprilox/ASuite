import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { getSession } from '@/lib/auth';

export async function PATCH(request: Request) {
  try {
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { locale } = await request.json();

    if (!locale || !['fr', 'en'].includes(locale)) {
      return NextResponse.json({ error: 'Locale invalide' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { locale },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur mise à jour locale:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

