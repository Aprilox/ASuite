import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { createShortCode, isValidUrl } from '@asuite/utils';
import QRCode from 'qrcode';
import { hash } from 'bcryptjs';
import { getSession } from '@/lib/auth';

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour créer un lien' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { originalUrl, password, expiresAt, maxClicks, title } = body;

    // Validate URL
    if (!originalUrl || !isValidUrl(originalUrl)) {
      return NextResponse.json(
        { error: 'URL invalide. Utilisez une URL complète (https://...)' },
        { status: 400 }
      );
    }

    // Generate unique short code
    let shortCode: string;
    let attempts = 0;
    do {
      shortCode = createShortCode();
      const existing = await prisma.link.findUnique({
        where: { shortCode },
      });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return NextResponse.json(
        { error: 'Impossible de générer un code unique. Réessayez.' },
        { status: 500 }
      );
    }

    // Hash password if provided
    const hashedPassword = password ? await hash(password, 10) : null;

    // Parse expiration date
    const expirationDate = expiresAt ? new Date(expiresAt) : null;

    // Generate QR code
    const shortUrl = `${BASE_URL}/l/${shortCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(shortUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    // Create link in database - associé à l'utilisateur
    const link = await prisma.link.create({
      data: {
        shortCode,
        originalUrl,
        title: title || null,
        password: hashedPassword,
        expiresAt: expirationDate,
        maxClicks: maxClicks || null,
        qrCode: qrCodeDataUrl,
        userId: user.id, // Associer à l'utilisateur connecté
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'create_link',
        resource: 'link',
        resourceId: link.id,
        metadata: JSON.stringify({
          shortCode,
          originalUrl,
          hasPassword: !!password,
          expiresAt: expirationDate,
          maxClicks,
        }),
      },
    });

    return NextResponse.json({
      id: link.id,
      shortCode: link.shortCode,
      shortUrl,
      originalUrl: link.originalUrl,
      qrCode: qrCodeDataUrl,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      hasPassword: !!link.password,
    });
  } catch (error) {
    console.error('Error creating link:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du lien' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour voir vos liens' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Ne retourner que les liens de l'utilisateur connecté
    const [links, total] = await Promise.all([
      prisma.link.findMany({
        where: { userId: user.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          shortCode: true,
          originalUrl: true,
          title: true,
          clickCount: true,
          createdAt: true,
          expiresAt: true,
          maxClicks: true,
          password: true,
        },
      }),
      prisma.link.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      links: links.map((link) => ({
        ...link,
        shortUrl: `${BASE_URL}/l/${link.shortCode}`,
        hasPassword: !!link.password,
        password: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching links:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des liens' },
      { status: 500 }
    );
  }
}
