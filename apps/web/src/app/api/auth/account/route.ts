import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@asuite/database';
import { getSession } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Delete all user data in order
    await prisma.$transaction(async (tx) => {
      // Delete link clicks
      const links = await tx.link.findMany({
        where: { userId: user.id },
        select: { id: true },
      });
      
      const linkIds = links.map((l) => l.id);
      
      await tx.linkClick.deleteMany({
        where: { linkId: { in: linkIds } },
      });

      // Delete links
      await tx.link.deleteMany({
        where: { userId: user.id },
      });

      // Delete audit logs
      await tx.auditLog.deleteMany({
        where: { userId: user.id },
      });

      // Delete sessions
      await tx.session.deleteMany({
        where: { userId: user.id },
      });

      // Delete user
      await tx.user.delete({
        where: { id: user.id },
      });
    });

    // Clear session cookie
    const cookieStore = await cookies();
    cookieStore.delete('session_token');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du compte' },
      { status: 500 }
    );
  }
}

