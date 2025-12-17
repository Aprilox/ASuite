import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@asuite/database';
import { isValidEmail, checkPasswordStrength } from '@asuite/utils';
import { checkGlobalRateLimit, getClientIp } from '@/lib/global-rate-limit';

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);

    // Rate limiting - Vérifier avant toute opération coûteuse
    const rateLimitResult = await checkGlobalRateLimit('register', clientIp);
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

    const body = await request.json();
    const { name, email, password } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Validation de longueur pour prévenir les abus
    if (name.length > 20) {
      return NextResponse.json(
        { error: 'Le nom est trop long (max 20 caractères)' },
        { status: 400 }
      );
    }

    if (email.length > 64) {
      return NextResponse.json(
        { error: 'L\'email est trop long (max 64 caractères)' },
        { status: 400 }
      );
    }

    if (password.length > 64) {
      return NextResponse.json(
        { error: 'Le mot de passe est trop long (max 64 caractères)' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    const passwordValidation = checkPasswordStrength(password);
    if (passwordValidation.score < 3) {
      return NextResponse.json(
        { error: 'Mot de passe trop faible', feedback: passwordValidation.feedback },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user (sans rôle par défaut - sera un utilisateur standard)
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'register',
        resource: 'user',
        resourceId: user.id,
        metadata: JSON.stringify({ email: user.email }),
      },
    });

    return NextResponse.json(
      {
        message: 'Compte créé avec succès',
        user: {
          ...user,
          role: 'user', // Les nouveaux utilisateurs sont des users par défaut
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte' },
      { status: 500 }
    );
  }
}
