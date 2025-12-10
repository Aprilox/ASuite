import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@asuite/database';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

// GET - Liste des notes de l'utilisateur
export async function GET() {
  try {
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    const vaults = await prisma.vault.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        code: true,
        title: true,
        encryptionKey: true,
        password: true,
        expiresAt: true,
        burnAfterRead: true,
        maxViews: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Transformer pour indiquer si protégé par mot de passe
    const vaultsWithInfo = vaults.map(vault => ({
      ...vault,
      hasPassword: !!vault.password,
      password: undefined,
      isExpired: vault.expiresAt ? new Date(vault.expiresAt) < new Date() : false,
    }));
    
    return NextResponse.json(vaultsWithInfo);
  } catch (error) {
    console.error('Error fetching vaults:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle note chiffrée
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    const body = await request.json();
    
    const { title, content, iv, encryptionKey, password, expiresAt, burnAfterRead, maxViews } = body;
    
    if (!content || !iv) {
      return NextResponse.json(
        { error: 'Contenu et IV requis' },
        { status: 400 }
      );
    }
    
    // Générer un code court unique
    let code = nanoid(10);
    let exists = await prisma.vault.findUnique({ where: { code } });
    while (exists) {
      code = nanoid(10);
      exists = await prisma.vault.findUnique({ where: { code } });
    }
    
    // Hasher le mot de passe si fourni
    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;
    
    // Vérifier que l'utilisateur est connecté (requis pour AVault)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    const vault = await prisma.vault.create({
      data: {
        code,
        title: title || null,
        content,
        iv,
        encryptionKey, // Toujours stockée car utilisateur toujours connecté
        userId: user.id,
        password: hashedPassword,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        burnAfterRead: burnAfterRead || false,
        maxViews: maxViews || null,
      },
    });
    
    return NextResponse.json({
      id: vault.id,
      code: vault.code,
      title: vault.title,
      createdAt: vault.createdAt,
    });
  } catch (error) {
    console.error('Error creating vault:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

