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
      select: {
        id: true,
        password: true,
        expiresAt: true,
        maxClicks: true,
        clickCount: true,
      },
    });

    if (!link) {
      return NextResponse.json(
        { exists: false, passwordProtected: false },
        { status: 404 }
      );
    }

    // Check expiration
    if (link.expiresAt && new Date() > link.expiresAt) {
      return NextResponse.json(
        { exists: true, expired: true, passwordProtected: !!link.password },
        { status: 410 }
      );
    }

    // Check click limit
    if (link.maxClicks && link.clickCount >= link.maxClicks) {
      return NextResponse.json(
        { exists: true, limitReached: true, passwordProtected: !!link.password },
        { status: 410 }
      );
    }

    return NextResponse.json({
      exists: true,
      passwordProtected: !!link.password,
    });
  } catch (error) {
    console.error('Error checking link:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

