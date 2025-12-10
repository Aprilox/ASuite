import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET - Récupérer une note par son code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');
    
    const vault = await prisma.vault.findUnique({
      where: { code },
    });
    
    if (!vault) {
      return NextResponse.json(
        { error: 'Note introuvable' },
        { status: 404 }
      );
    }
    
    // Vérifier si expirée
    if (vault.expiresAt && new Date(vault.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Cette note a expiré' },
        { status: 410 }
      );
    }
    
    // Vérifier limite de vues
    if (vault.maxViews && vault.viewCount >= vault.maxViews) {
      return NextResponse.json(
        { error: 'Cette note a atteint sa limite de vues' },
        { status: 410 }
      );
    }
    
    // Vérifier mot de passe si protégé
    if (vault.password) {
      if (!password) {
        // Retourner 200 avec flag pour éviter l'erreur console
        return NextResponse.json({ requiresPassword: true });
      }
      
      const isValid = await bcrypt.compare(password, vault.password);
      if (!isValid) {
        return NextResponse.json({ wrongPassword: true });
      }
    }
    
    // Récupérer IP et user agent pour analytics
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || '';
    
    // Détecter appareil et navigateur
    const device = /mobile/i.test(userAgent) ? 'mobile' : 
                   /tablet/i.test(userAgent) ? 'tablet' : 'desktop';
    const browser = userAgent.includes('Firefox') ? 'Firefox' :
                    userAgent.includes('Chrome') ? 'Chrome' :
                    userAgent.includes('Safari') ? 'Safari' :
                    userAgent.includes('Edge') ? 'Edge' : 'Other';
    
    // Enregistrer la vue
    await prisma.vaultView.create({
      data: {
        vaultId: vault.id,
        ipAddress: ip,
        device,
        browser,
      },
    });
    
    // Incrémenter le compteur
    await prisma.vault.update({
      where: { id: vault.id },
      data: { viewCount: { increment: 1 } },
    });
    
    // Si burn after read, supprimer la note
    if (vault.burnAfterRead) {
      await prisma.vault.delete({ where: { id: vault.id } });
    }
    
    return NextResponse.json({
      title: vault.title,
      content: vault.content,
      iv: vault.iv,
      burnAfterRead: vault.burnAfterRead,
      createdAt: vault.createdAt,
    });
  } catch (error) {
    console.error('Error fetching vault:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une note (propriétaire uniquement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getSession();
    const { code } = await params;
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    const vault = await prisma.vault.findUnique({
      where: { code },
    });
    
    if (!vault) {
      return NextResponse.json(
        { error: 'Note introuvable' },
        { status: 404 }
      );
    }
    
    if (vault.userId !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }
    
    await prisma.vault.delete({ where: { id: vault.id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vault:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

