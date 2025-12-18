import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@asuite/database';

export async function GET() {
  try {
    const user = await getSession();

    // Retourner null si pas connecté (pas de 401 pour éviter les erreurs console)
    if (!user) {
      return NextResponse.json(null);
    }

    // Récupérer le paramètre de vérification d'email
    const verificationSetting = await prisma.systemSetting.findFirst({
      where: { key: 'security_email_verification' }
    });
    const verificationRequired = verificationSetting?.value === 'true';

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      theme: user.theme,
      locale: user.locale,
      emailVerified: user.emailVerified,
      verificationRequired,
    });
  } catch (error) {
    console.error('Error checking auth:', error);
    return NextResponse.json(null);
  }
}

