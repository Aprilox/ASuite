/**
 * Script CLI pour créer un administrateur
 * Usage: pnpm admin:create <email> <password> [name]
 * 
 * Ce script :
 * - Crée ou met à jour l'utilisateur avec le rôle admin
 * - Crée le rôle admin système s'il n'existe pas
 * - Crée toutes les permissions de base
 * - Attribue toutes les permissions au rôle admin
 */

// Charger le fichier .env AVANT tout import Prisma
import * as path from 'path';
import * as dotenv from 'dotenv';

const envPath = path.resolve(__dirname, '../../../.env');
console.log(`📁 Chargement .env depuis: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Erreur chargement .env:', result.error.message);
}

console.log(`🔗 DATABASE_URL: ${process.env.DATABASE_URL ? 'défini' : 'NON DÉFINI'}`);

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Passer explicitement le datasource URL au client Prisma
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Liste complète des permissions
const PERMISSIONS = [
  // Users
  { code: 'users.view', name: 'Voir les utilisateurs', module: 'users', description: 'Accéder à la liste des utilisateurs' },
  { code: 'users.edit', name: 'Modifier les utilisateurs', module: 'users', description: 'Modifier les informations des utilisateurs' },
  { code: 'users.block', name: 'Bloquer les utilisateurs', module: 'users', description: 'Bloquer/débloquer les utilisateurs' },
  { code: 'users.delete', name: 'Supprimer les utilisateurs', module: 'users', description: 'Supprimer des utilisateurs' },
  { code: 'users.reset_password', name: 'Réinitialiser les mots de passe', module: 'users', description: 'Envoyer des emails de réinitialisation' },
  
  // Roles
  { code: 'roles.view', name: 'Voir les rôles', module: 'roles', description: 'Accéder à la liste des rôles' },
  { code: 'roles.create', name: 'Créer des rôles', module: 'roles', description: 'Créer de nouveaux rôles' },
  { code: 'roles.edit', name: 'Modifier les rôles', module: 'roles', description: 'Modifier les rôles existants' },
  { code: 'roles.delete', name: 'Supprimer les rôles', module: 'roles', description: 'Supprimer des rôles' },
  { code: 'roles.assign', name: 'Assigner des rôles', module: 'roles', description: 'Attribuer des rôles aux utilisateurs' },
  
  // Tickets
  { code: 'tickets.view', name: 'Voir les tickets', module: 'tickets', description: 'Accéder aux tickets de support' },
  { code: 'tickets.respond', name: 'Répondre aux tickets', module: 'tickets', description: 'Répondre aux tickets utilisateurs' },
  { code: 'tickets.close', name: 'Fermer les tickets', module: 'tickets', description: 'Fermer et résoudre les tickets' },
  { code: 'tickets.delete', name: 'Supprimer les tickets', module: 'tickets', description: 'Supprimer des tickets' },
  
  // Settings
  { code: 'settings.view', name: 'Voir les paramètres', module: 'settings', description: 'Accéder aux paramètres système' },
  { code: 'settings.edit', name: 'Modifier les paramètres', module: 'settings', description: 'Modifier les paramètres système' },
  
  // Audit
  { code: 'audit.view', name: 'Voir les logs d\'audit', module: 'audit', description: 'Accéder aux logs d\'audit' },
  
  // Admin Dashboard
  { code: 'admin.dashboard', name: 'Dashboard admin', module: 'admin', description: 'Accéder au dashboard d\'administration' },
];

async function seedPermissions() {
  console.log('🔑 Création des permissions...');
  
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, module: perm.module, description: perm.description },
      create: perm,
    });
  }
  
  console.log(`   ✅ ${PERMISSIONS.length} permissions créées/mises à jour`);
}

async function createAdminRole() {
  console.log('👑 Création du rôle administrateur...');
  
  // Créer ou récupérer le rôle admin
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {
      displayName: 'Administrateur',
      description: 'Accès complet au système',
      color: '#dc2626',
      isSystem: true,
      priority: 0, // Plus haute priorité
    },
    create: {
      name: 'admin',
      displayName: 'Administrateur',
      description: 'Accès complet au système',
      color: '#dc2626',
      isSystem: true,
      priority: 0, // Plus haute priorité
    },
  });
  
  // Récupérer toutes les permissions
  const permissions = await prisma.permission.findMany();
  
  // Supprimer les anciennes associations et recréer
  await prisma.rolePermission.deleteMany({
    where: { roleId: adminRole.id },
  });
  
  // Associer toutes les permissions au rôle admin
  await prisma.rolePermission.createMany({
    data: permissions.map((p) => ({
      roleId: adminRole.id,
      permissionId: p.id,
    })),
  });
  
  console.log(`   ✅ Rôle admin créé avec ${permissions.length} permissions`);
  
  return adminRole;
}

async function createSupportRole() {
  console.log('🎧 Création du rôle support...');
  
  const supportRole = await prisma.role.upsert({
    where: { name: 'support' },
    update: {
      displayName: 'Support',
      description: 'Accès au support utilisateur',
      color: '#2563eb',
      isSystem: false,
    },
    create: {
      name: 'support',
      displayName: 'Support',
      description: 'Accès au support utilisateur',
      color: '#2563eb',
      isSystem: false,
    },
  });
  
  // Permissions pour le support
  const supportPermissions = [
    'users.view',
    'tickets.view',
    'tickets.respond',
    'tickets.close',
    'admin.dashboard',
  ];
  
  const permissions = await prisma.permission.findMany({
    where: { code: { in: supportPermissions } },
  });
  
  await prisma.rolePermission.deleteMany({
    where: { roleId: supportRole.id },
  });
  
  await prisma.rolePermission.createMany({
    data: permissions.map((p) => ({
      roleId: supportRole.id,
      permissionId: p.id,
    })),
  });
  
  console.log(`   ✅ Rôle support créé avec ${permissions.length} permissions`);
  
  return supportRole;
}

async function createAdmin(email: string, password: string, name?: string) {
  console.log(`👤 Création de l'administrateur ${email}...`);
  
  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Récupérer le rôle admin
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
  });
  
  if (!adminRole) {
    throw new Error('Le rôle admin n\'existe pas. Exécutez d\'abord le seed.');
  }
  
  // Créer ou mettre à jour l'utilisateur
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      name: name || 'Administrateur',
      emailVerified: new Date(),
      isBlocked: false,
    },
    create: {
      email,
      password: hashedPassword,
      name: name || 'Administrateur',
      emailVerified: new Date(),
      theme: 'system',
      locale: 'fr',
    },
  });
  
  // Vérifier si l'utilisateur a déjà le rôle admin
  const existingRole = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: adminRole.id,
      },
    },
  });
  
  if (!existingRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });
  }
  
  console.log(`   ✅ Administrateur créé: ${email}`);
  
  return user;
}

async function initTicketCounter() {
  console.log('🔢 Initialisation du compteur de tickets...');
  
  await prisma.counter.upsert({
    where: { name: 'ticket_number' },
    update: {},
    create: { name: 'ticket_number', value: 0 },
  });
  
  console.log('   ✅ Compteur initialisé');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║               ASuite - Création d'administrateur              ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Usage:                                                       ║
║    pnpm admin:create <email> <password> [name]                ║
║                                                               ║
║  Exemples:                                                    ║
║    pnpm admin:create admin@example.com "MonMotDePasse123"     ║
║    pnpm admin:create admin@example.com "Pass123" "Jean Admin" ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
  }
  
  const [email, password, name] = args;
  
  // Validation email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ Email invalide');
    process.exit(1);
  }
  
  // Validation mot de passe
  if (password.length < 8) {
    console.error('❌ Le mot de passe doit contenir au moins 8 caractères');
    process.exit(1);
  }
  
  console.log('\n🚀 Initialisation du système d\'administration ASuite\n');
  
  try {
    // 1. Créer les permissions
    await seedPermissions();
    
    // 2. Créer les rôles
    await createAdminRole();
    await createSupportRole();
    
    // 3. Initialiser le compteur de tickets
    await initTicketCounter();
    
    // 4. Créer l'administrateur
    await createAdmin(email, password, name);
    
    console.log('\n✨ Configuration terminée avec succès!\n');
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔐 Mot de passe: [défini]`);
    console.log(`   👑 Rôle: Administrateur (accès complet)\n`);
    
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
