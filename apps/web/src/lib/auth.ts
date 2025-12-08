import { cookies } from 'next/headers';
import { prisma } from '@asuite/database';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export async function getSession(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getSession();
  if (!user) {
    throw new Error('Non autorisé');
  }
  return user;
}

