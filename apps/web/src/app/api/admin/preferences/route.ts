import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { requireAdminPermission } from '@/lib/admin-auth';

// GET /api/admin/preferences - Récupérer les préférences admin
export async function GET() {
  try {
    const admin = await requireAdminPermission();
    
    const user = await prisma.user.findUnique({
      where: { id: admin.id },
      select: { adminPrefs: true },
    });

    let preferences = {};
    if (user?.adminPrefs) {
      try {
        preferences = JSON.parse(user.adminPrefs);
      } catch {
        // Invalid JSON, return empty
      }
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    if (error instanceof Error && error.message === 'Non autorisé') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/admin/preferences - Mettre à jour les préférences admin
export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminPermission();
    const body = await request.json();
    const { key, value } = body;

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Clé requise' }, { status: 400 });
    }

    // Récupérer les préférences existantes
    const user = await prisma.user.findUnique({
      where: { id: admin.id },
      select: { adminPrefs: true },
    });

    let preferences: Record<string, unknown> = {};
    if (user?.adminPrefs) {
      try {
        preferences = JSON.parse(user.adminPrefs);
      } catch {
        // Invalid JSON, start fresh
      }
    }

    // Mettre à jour la clé
    preferences[key] = value;

    // Sauvegarder
    await prisma.user.update({
      where: { id: admin.id },
      data: { adminPrefs: JSON.stringify(preferences) },
    });

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    if (error instanceof Error && error.message === 'Non autorisé') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    console.error('Error updating admin preferences:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

