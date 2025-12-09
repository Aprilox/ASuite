import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { compare, hash } from 'bcryptjs';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer le token de la session courante
    const cookieStore = await cookies();
    const currentSessionToken = cookieStore.get('session_token')?.value;

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Mot de passe actuel et nouveau mot de passe requis' },
        { status: 400 }
      );
    }

    // Validate password requirements
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);

    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre' },
        { status: 400 }
      );
    }

    // Get user with password
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser || !dbUser.password) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Verify current password
    const isValid = await compare(currentPassword, dbUser.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Mot de passe actuel incorrect' },
        { status: 401 }
      );
    }

    // Hash and update new password (cost 12 pour cohérence avec register)
    const hashedPassword = await hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Invalider toutes les autres sessions (sécurité: déconnecte les autres appareils)
    if (currentSessionToken) {
      await prisma.session.deleteMany({
        where: {
          userId: user.id,
          sessionToken: { not: currentSessionToken },
        },
      });
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'password_change',
        resource: 'user',
        resourceId: user.id,
        metadata: JSON.stringify({ sessionsInvalidated: true }),
      },
    });

    return NextResponse.json({ success: true, message: 'Mot de passe modifié. Les autres sessions ont été déconnectées.' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Erreur lors du changement de mot de passe' },
      { status: 500 }
    );
  }
}

