/**
 * Script CLI interactif pour créer un administrateur
 * Usage: pnpm db:admin
 * 
 * Ce script :
 * - Demande les informations de manière interactive
 * - Crée ou met à jour l'utilisateur avec le rôle admin
 * - Crée le rôle admin système s'il n'existe pas
 * - Crée toutes les permissions de base
 */

// Charger le fichier .env AVANT tout import Prisma
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Interface readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisify readline question
function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

// Fonction pour lire le mot de passe (affiché en clair)
function questionPassword(prompt: string): Promise<string> {
  return question(prompt);
}

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
  { code: 'roles.reorder', name: 'Réorganiser les rôles', module: 'roles', description: 'Modifier l\'ordre de priorité des rôles' },
  
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
  process.stdout.write('🔑 Création des permissions... ');
  
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, module: perm.module, description: perm.description },
      create: perm,
    });
  }
  
  console.log(`✅ ${PERMISSIONS.length} permissions`);
}

async function createAdminRole() {
  process.stdout.write('👑 Création du rôle admin... ');
  
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {
      displayName: 'Administrateur',
      description: 'Accès complet au système',
      color: '#dc2626',
      isSystem: true,
      priority: 0,
    },
    create: {
      name: 'admin',
      displayName: 'Administrateur',
      description: 'Accès complet au système',
      color: '#dc2626',
      isSystem: true,
      priority: 0,
    },
  });
  
  const permissions = await prisma.permission.findMany();
  
  await prisma.rolePermission.deleteMany({
    where: { roleId: adminRole.id },
  });
  
  await prisma.rolePermission.createMany({
    data: permissions.map((p) => ({
      roleId: adminRole.id,
      permissionId: p.id,
    })),
  });
  
  console.log(`✅ ${permissions.length} permissions`);
  
  return adminRole;
}

async function createSupportRole() {
  process.stdout.write('🎧 Création du rôle support... ');
  
  const supportRole = await prisma.role.upsert({
    where: { name: 'support' },
    update: {
      displayName: 'Support',
      description: 'Accès au support utilisateur',
      color: '#2563eb',
      isSystem: false,
      priority: 1,
    },
    create: {
      name: 'support',
      displayName: 'Support',
      description: 'Accès au support utilisateur',
      color: '#2563eb',
      isSystem: false,
      priority: 1,
    },
  });
  
  const supportPermissions = [
    'users.view',
    'tickets.view',
    'tickets.respond',
    'tickets.close',
    'admin.dashboard',
    'roles.view',
    'roles.reorder',
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
  
  console.log(`✅ ${permissions.length} permissions`);
  
  return supportRole;
}

async function createAdmin(email: string, password: string, name: string) {
  process.stdout.write('👤 Création de l\'administrateur... ');
  
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
  });
  
  if (!adminRole) {
    throw new Error('Le rôle admin n\'existe pas.');
  }
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      name: name,
      emailVerified: new Date(),
      isBlocked: false,
    },
    create: {
      email,
      password: hashedPassword,
      name: name,
      emailVerified: new Date(),
      theme: 'system',
      locale: 'fr',
    },
  });
  
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
  
  console.log('✅');
  
  return user;
}

async function initTicketCounter() {
  process.stdout.write('🔢 Initialisation du compteur... ');
  
  await prisma.counter.upsert({
    where: { name: 'ticket_number' },
    update: {},
    create: { name: 'ticket_number', value: 0 },
  });
  
  console.log('✅');
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          ASuite - Création d\'administrateur                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Vérifier la connexion à la base de données
  try {
    await prisma.$connect();
  } catch {
    console.error('❌ Impossible de se connecter à la base de données.');
    console.error('   Vérifiez que DATABASE_URL est défini dans .env\n');
    process.exit(1);
  }
  
  // Demander l'email
  let email = '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  while (!email || !emailRegex.test(email)) {
    email = await question('📧 Email de l\'administrateur: ');
    if (!emailRegex.test(email)) {
      console.log('   ⚠️  Email invalide, réessayez.\n');
    }
  }
  
  // Vérifier si l'utilisateur existe
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log(`   ℹ️  Utilisateur existant - le mot de passe sera mis à jour.\n`);
  }
  
  // Demander le mot de passe
  let password = '';
  let confirmPassword = '';
  
  while (password.length < 8) {
    password = await questionPassword('🔐 Mot de passe (min. 8 caractères): ');
    if (password.length < 8) {
      console.log('   ⚠️  Le mot de passe doit contenir au moins 8 caractères.\n');
    }
  }
  
  // Confirmer le mot de passe
  while (confirmPassword !== password) {
    confirmPassword = await questionPassword('🔐 Confirmer le mot de passe: ');
    if (confirmPassword !== password) {
      console.log('   ⚠️  Les mots de passe ne correspondent pas.\n');
    }
  }
  
  // Demander le nom (optionnel)
  const name = await question('👤 Nom (optionnel, Entrée pour ignorer): ') || 'Administrateur';
  
  console.log('\n─────────────────────────────────────────────────────────────\n');
  
  rl.close();
  
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
    
    console.log('\n─────────────────────────────────────────────────────────────');
    console.log('\n✨ Configuration terminée avec succès!\n');
    console.log(`   📧 Email: ${email}`);
    console.log(`   👤 Nom: ${name}`);
    console.log(`   👑 Rôle: Administrateur (accès complet)`);
    console.log(`\n   🌐 Connectez-vous sur /admin pour accéder au panel.\n`);
    
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
