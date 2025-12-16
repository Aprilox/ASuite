/**
 * Script pour initialiser les permissions et rôles de base
 * Usage: pnpm db:seed
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Charger le .env depuis la racine du monorepo
config({ path: resolve(__dirname, '../../../.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

// Paramètres système par défaut
const DEFAULT_SETTINGS = [
  // General
  { key: 'site.name', value: 'ASuite', type: 'string', category: 'general', label: 'Nom du site' },
  { key: 'site.description', value: 'Suite collaborative professionnelle', type: 'string', category: 'general', label: 'Description' },

  // Security - Fonctionnels
  { key: 'security.max_login_attempts', value: '5', type: 'number', category: 'security', label: 'Tentatives de connexion max' },
  { key: 'security.lockout_duration', value: '15', type: 'number', category: 'security', label: 'Durée de blocage (minutes)' },
  { key: 'security.session_duration', value: '7', type: 'number', category: 'security', label: 'Durée de session (jours)' },

  // Email - Fonctionnels
  { key: 'email.smtp_host', value: '', type: 'string', category: 'email', label: 'Serveur SMTP' },
  { key: 'email.smtp_port', value: '587', type: 'number', category: 'email', label: 'Port SMTP' },
  { key: 'email.smtp_user', value: '', type: 'string', category: 'email', label: 'Utilisateur SMTP' },
  { key: 'email.smtp_password', value: '', type: 'string', category: 'email', label: 'Mot de passe SMTP' },
  { key: 'email.from_address', value: 'noreply@asuite.local', type: 'string', category: 'email', label: 'Adresse d\'envoi' },
  { key: 'email.from_name', value: 'ASuite', type: 'string', category: 'email', label: 'Nom d\'expéditeur' },

  // Support - Nouveaux paramètres
  { key: 'support.ticketRateLimit', value: '3', type: 'number', category: 'support', label: 'Max tickets par heure par utilisateur' },
  { key: 'support.subjectMaxLength', value: '200', type: 'number', category: 'support', label: 'Longueur max sujet ticket' },
  { key: 'support.messageMaxLength', value: '10000', type: 'number', category: 'support', label: 'Longueur max message ticket' },
  { key: 'support.creationEnabled', value: 'true', type: 'boolean', category: 'support', label: 'Activer création tickets' },
];

async function main() {
  console.log('\n🌱 Seed de la base de données ASuite\n');

  // 1. Créer les permissions
  console.log('🔑 Création des permissions...');
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, module: perm.module, description: perm.description },
      create: perm,
    });
  }
  console.log(`   ✅ ${PERMISSIONS.length} permissions`);

  // 2. Créer le rôle admin
  console.log('👑 Création du rôle administrateur...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: { priority: 0 },
    create: {
      name: 'admin',
      displayName: 'Administrateur',
      description: 'Accès complet au système',
      color: '#dc2626',
      isSystem: true,
      priority: 0, // Plus haute priorité
    },
  });

  // Associer toutes les permissions au rôle admin
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }
  console.log(`   ✅ Rôle admin avec ${allPermissions.length} permissions`);

  // 3. Créer le rôle support
  console.log('🎧 Création du rôle support...');
  const supportRole = await prisma.role.upsert({
    where: { name: 'support' },
    update: { priority: 1 },
    create: {
      name: 'support',
      displayName: 'Support',
      description: 'Accès au support utilisateur',
      color: '#2563eb',
      isSystem: false,
      priority: 1, // Juste après l'admin (priority 0)
    },
  });

  const supportPermissions = ['users.view', 'tickets.view', 'tickets.respond', 'tickets.close', 'admin.dashboard', 'roles.view', 'roles.reorder'];
  const supportPerms = await prisma.permission.findMany({
    where: { code: { in: supportPermissions } },
  });

  for (const perm of supportPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: supportRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: supportRole.id,
        permissionId: perm.id,
      },
    });
  }
  console.log(`   ✅ Rôle support avec ${supportPerms.length} permissions`);

  // 4. Créer les paramètres système
  console.log('⚙️  Création des paramètres système...');
  for (const setting of DEFAULT_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`   ✅ ${DEFAULT_SETTINGS.length} paramètres`);

  // 5. Initialiser le compteur de tickets
  console.log('🔢 Initialisation du compteur de tickets...');
  await prisma.counter.upsert({
    where: { name: 'ticket_number' },
    update: {},
    create: { name: 'ticket_number', value: 0 },
  });
  console.log('   ✅ Compteur initialisé');

  console.log('\n✨ Seed terminé avec succès!\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

