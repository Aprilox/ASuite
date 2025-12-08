import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { getSession } from '@/lib/auth';

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = params;

    const link = await prisma.link.findUnique({
      where: { id },
      include: {
        clicks: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!link) {
      return NextResponse.json({ error: 'Lien non trouvé' }, { status: 404 });
    }

    // Vérifier que le lien appartient à l'utilisateur
    if (link.userId !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const clicksByDevice = link.clicks.reduce((acc, click) => {
      const device = click.device || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const clicksByBrowser = link.clicks.reduce((acc, click) => {
      const browser = click.browser || 'unknown';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      id: link.id,
      shortCode: link.shortCode,
      shortUrl: `${BASE_URL}/l/${link.shortCode}`,
      originalUrl: link.originalUrl,
      title: link.title,
      clickCount: link.clickCount,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      maxClicks: link.maxClicks,
      hasPassword: !!link.password,
      qrCode: link.qrCode,
      analytics: {
        totalClicks: link.clickCount,
        clicksByDevice: Object.entries(clicksByDevice).map(([device, count]) => ({
          device,
          count,
        })),
        clicksByBrowser: Object.entries(clicksByBrowser).map(([browser, count]) => ({
          browser,
          count,
        })),
        recentClicks: link.clicks.slice(0, 10).map((click) => ({
          id: click.id,
          device: click.device,
          browser: click.browser,
          os: click.os,
          referer: click.referer,
          createdAt: click.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching link:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du lien' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = params;

    const link = await prisma.link.findUnique({
      where: { id },
    });

    if (!link) {
      return NextResponse.json({ error: 'Lien non trouvé' }, { status: 404 });
    }

    // Vérifier que le lien appartient à l'utilisateur
    if (link.userId !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Delete clicks first (cascade)
    await prisma.linkClick.deleteMany({
      where: { linkId: id },
    });

    // Delete link
    await prisma.link.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'delete_link',
        resource: 'link',
        resourceId: id,
        metadata: JSON.stringify({
          shortCode: link.shortCode,
          originalUrl: link.originalUrl,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting link:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du lien' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { title, expiresAt, maxClicks, password, removePassword } = body;

    const link = await prisma.link.findUnique({
      where: { id },
    });

    if (!link) {
      return NextResponse.json({ error: 'Lien non trouvé' }, { status: 404 });
    }

    // Vérifier que le lien appartient à l'utilisateur
    if (link.userId !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {
      title: title !== undefined ? title : link.title,
      expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : link.expiresAt,
      maxClicks: maxClicks !== undefined ? maxClicks : link.maxClicks,
    };

    // Gérer le mot de passe
    if (removePassword) {
      updateData.password = null;
    } else if (password) {
      const { hash } = await import('bcryptjs');
      updateData.password = await hash(password, 10);
    }

    const updatedLink = await prisma.link.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: updatedLink.id,
      shortCode: updatedLink.shortCode,
      shortUrl: `${BASE_URL}/l/${updatedLink.shortCode}`,
      originalUrl: updatedLink.originalUrl,
      title: updatedLink.title,
      clickCount: updatedLink.clickCount,
      createdAt: updatedLink.createdAt,
      expiresAt: updatedLink.expiresAt,
      maxClicks: updatedLink.maxClicks,
      hasPassword: !!updatedLink.password,
    });
  } catch (error) {
    console.error('Error updating link:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du lien' },
      { status: 500 }
    );
  }
}
