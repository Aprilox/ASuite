import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@asuite/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    // Find link
    const link = await prisma.link.findUnique({
      where: { shortCode: code },
    });

    if (!link) {
      return NextResponse.redirect(new URL('/l/not-found', request.url));
    }

    // Check if link has expired
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.redirect(new URL('/l/expired', request.url));
    }

    // Check max clicks
    if (link.maxClicks && link.clickCount >= link.maxClicks) {
      return NextResponse.redirect(new URL('/l/limit-reached', request.url));
    }

    // Check if password protected - redirect to password page
    if (link.password) {
      return NextResponse.redirect(new URL(`/l/protected/${code}`, request.url));
    }

    // Record click
    await recordClick(link.id, request);

    // Increment click count
    await prisma.link.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    });

    // Redirect to original URL
    return NextResponse.redirect(link.originalUrl);
  } catch (error) {
    console.error('Error handling redirect:', error);
    return NextResponse.redirect(new URL('/l/not-found', request.url));
  }
}

async function recordClick(linkId: string, request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || null;

    // Parse user agent for device/browser info
    const device = detectDevice(userAgent);
    const browser = detectBrowser(userAgent);
    const os = detectOS(userAgent);

    await prisma.linkClick.create({
      data: {
        linkId,
        device,
        browser,
        os,
        referer,
      },
    });
  } catch (error) {
    console.error('Error recording click:', error);
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
