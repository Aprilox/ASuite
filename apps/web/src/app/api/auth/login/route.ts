import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { prisma } from '@asuite/database';
import { isValidEmail } from '@asuite/utils';
import { cookies } from 'next/headers';
import { createUniqueId } from '@asuite/utils';
import { checkGlobalRateLimit, getClientIp } from '@/lib/global-rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    const clientIp = getClientIp(request);

    // Validation basique avant le rate limit check
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    // Vérifier le rate limit AVANT toute opération coûteuse
    const rateLimitResult = await checkGlobalRateLimit('login', clientIp);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.reason },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 900),
          },
        }
      );
    }

    // Find user with roles
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                name: true,
                isSystem: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Vérifier si l'utilisateur est bloqué
    if (user.isBlocked) {
      return NextResponse.json(
        { error: 'Ce compte a été bloqué. Contactez le support.' },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Récupérer la durée de session depuis les paramètres
    const sessionDurationSetting = await prisma.systemSetting.findUnique({
      where: { key: 'security.session_duration' },
    });
    const sessionDays = parseInt(sessionDurationSetting?.value || '7', 10);

    // Create session
    const sessionToken = createUniqueId();
    const expires = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'login',
        resource: 'session',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires,
      path: '/',
    });

    // Synchroniser le cookie locale avec la préférence utilisateur en DB
    if (user.locale) {
      cookieStore.set('locale', user.locale, {
        httpOnly: false, // Accessible côté client pour next-intl
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 an
        path: '/',
      });
    }

    // Déterminer le rôle principal
    let role = 'user';
    if (user.userRoles && user.userRoles.length > 0) {
      const systemRole = user.userRoles.find((ur) => ur.role.isSystem);
      if (systemRole) {
        role = systemRole.role.name;
      } else {
        role = user.userRoles[0].role.name;
      }
    }

    // Mettre à jour la dernière connexion
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      },
    });

    // Récupérer le paramètre de vérification d'email
    const verificationSetting = await prisma.systemSetting.findUnique({
      where: { key: 'security_email_verification' },
    });
    const verificationRequired = verificationSetting?.value === 'true';

    return NextResponse.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        theme: user.theme,
        locale: user.locale,
        emailVerified: user.emailVerified,
        verificationRequired,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    );
  }
}

