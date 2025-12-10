import { NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { 
  requireAdminPermission, 
  getRequestInfo, 
  createAuditLog 
} from '@/lib/admin-auth';

// GET /api/admin/settings - Liste des paramètres système
export async function GET(request: Request) {
  try {
    await requireAdminPermission('settings.view');

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';

    const where: Record<string, unknown> = {};
    if (category) {
      where.category = category;
    }

    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
      ],
    });

    // Grouper par catégorie
    const grouped: Record<string, typeof settings> = {};
    for (const setting of settings) {
      if (!grouped[setting.category]) {
        grouped[setting.category] = [];
      }
      grouped[setting.category].push(setting);
    }

    // Liste des catégories disponibles (les noms seront traduits côté client)
    const categories = [
      { id: 'general', icon: 'settings' },
      { id: 'security', icon: 'shield' },
      { id: 'email', icon: 'mail' },
      { id: 'storage', icon: 'hard-drive' },
    ];

    return NextResponse.json({
      settings,
      byCategory: grouped,
      categories,
    });
  } catch (error) {
    console.error('Admin settings list error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/admin/settings - Mettre à jour des paramètres
export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminPermission('settings.edit');
    const { ipAddress, userAgent } = getRequestInfo(request);
    const body = await request.json();

    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    const updated: string[] = [];

    for (const [key, value] of Object.entries(settings)) {
      const existing = await prisma.systemSetting.findUnique({
        where: { key },
      });

      if (existing) {
        await prisma.systemSetting.update({
          where: { key },
          data: { value: String(value) },
        });
        updated.push(key);
      }
    }

    await createAuditLog(
      admin.id,
      'admin.settings.update',
      'settings',
      undefined,
      { updated },
      ipAddress,
      userAgent
    );

    return NextResponse.json({ 
      success: true, 
      message: `${updated.length} paramètre(s) mis à jour`,
      updated,
    });
  } catch (error) {
    console.error('Admin settings update error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/settings - Créer un nouveau paramètre
export async function POST(request: Request) {
  try {
    const admin = await requireAdminPermission('settings.edit');
    const { ipAddress, userAgent } = getRequestInfo(request);
    const body = await request.json();

    const { key, value, type, category, label } = body;

    if (!key || !category) {
      return NextResponse.json({ error: 'Clé et catégorie requises' }, { status: 400 });
    }

    // Vérifier si le paramètre existe déjà
    const existing = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (existing) {
      return NextResponse.json({ error: 'Ce paramètre existe déjà' }, { status: 400 });
    }

    const setting = await prisma.systemSetting.create({
      data: {
        key,
        value: value || '',
        type: type || 'string',
        category,
        label: label || key,
      },
    });

    await createAuditLog(
      admin.id,
      'admin.settings.create',
      'settings',
      setting.id,
      { key, category },
      ipAddress,
      userAgent
    );

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    console.error('Admin settings create error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Non autorisé' || error.message === 'Permission insuffisante') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

