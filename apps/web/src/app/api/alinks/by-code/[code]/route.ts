import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@asuite/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    const link = await prisma.link.findUnique({
      where: { shortCode: code },
      include: {
        clicks: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: 'Lien non trouvé' },
        { status: 404 }
      );
    }

    const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

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
    console.error('Error fetching link by code:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du lien' },
      { status: 500 }
    );
  }
}

