import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { compare } from 'bcryptjs';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Mot de passe requis' },
        { status: 400 }
      );
    }

    const link = await prisma.link.findUnique({
      where: { shortCode: code },
    });

    if (!link) {
      return NextResponse.json(
        { error: 'Lien non trouvé' },
        { status: 404 }
      );
    }

    if (!link.password) {
      return NextResponse.json(
        { error: 'Ce lien n\'est pas protégé par un mot de passe' },
        { status: 400 }
      );
    }

    // Verify password
    const isValid = await compare(password, link.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Check expiration
    if (link.expiresAt && new Date() > link.expiresAt) {
      return NextResponse.json(
        { error: 'Ce lien a expiré' },
        { status: 410 }
      );
    }

    // Check click limit
    if (link.maxClicks && link.clickCount >= link.maxClicks) {
      return NextResponse.json(
        { error: 'Ce lien a atteint sa limite de clics' },
        { status: 410 }
      );
    }

    // Record click
    const userAgent = request.headers.get('user-agent') || '';

    await prisma.$transaction([
      prisma.link.update({
        where: { id: link.id },
        data: { clickCount: { increment: 1 } },
      }),
      prisma.linkClick.create({
        data: {
          linkId: link.id,
          device: detectDevice(userAgent),
          browser: detectBrowser(userAgent),
          os: detectOS(userAgent),
          referer: request.headers.get('referer'),
        },
      }),
    ]);

    return NextResponse.json({ url: link.originalUrl });
  } catch (error) {
    console.error('Error verifying password:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

function detectDevice(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

function detectBrowser(userAgent: string): string {
  if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'Safari';
  if (/edge/i.test(userAgent)) return 'Edge';
  if (/opera|opr/i.test(userAgent)) return 'Opera';
  return 'Other';
}

function detectOS(userAgent: string): string {
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/macintosh|mac os/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/iphone|ipad/i.test(userAgent)) return 'iOS';
  return 'Other';
}
