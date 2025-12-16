# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

## [1.7.0] - 2025-12-16

### Nouveautés - Notifications Admin
- 🔔 Notifications temps réel SSE sans rechargement de page
- 🔔 Cloche de notifications dans la navbar avec dropdown et badge
- 📊 Auto-refresh de la liste des tickets lors de nouvelles notifications
- 🔴 Cercles rouges sur les tickets non lus dans la liste
- ⬆️ Tri intelligent : tickets avec nouvelle activité remontent automatiquement en haut
- 🎨 Badge sur le menu "Tickets" affichant le nombre de notifications
- ✅ Marquage automatique comme lu à l'ouverture d'un ticket

### Nouveautés - Notifications Client
- 🔔 Cloche de notifications dans le header du dashboard
- 🎨 Badge sur le menu "Support" affichant le nombre de notifications
- 🔴 Cercles rouges sur les tickets avec réponses admin
- 🔄 Notifications mises à jour au rafraîchissement (optimisé pour scalabilité)

### Améliorations
- ⚡ État des notifications partagé globalement entre tous les composants
- 📡 Architecture SSE uniquement pour admins (scalable pour milliers de clients)
- 🎯 Utilisation des IDs réels de base de données
- 🔄 Gestion améliorée de la suppression de tickets

---

## [1.6.3] - 2025-12-11

### Nouveautés - Interface Admin
- 👁️ Icônes contextuelles : crayon (éditer) si droits suffisants, œil (voir) sinon
- 👤 Nom de l'utilisateur affiché dans la navbar admin (comme dans le dashboard)
- 🔒 Paramètres non implémentés automatiquement grisés et désactivés

### Améliorations - Logs d'audit
- 📝 Traductions complètes de tous les types d'activités (26 actions)
- 👥 Affichage des noms des utilisateurs/rôles au lieu des IDs dans les logs
- ✅ Enrichissement automatique des logs avec les noms depuis la base de données

### Améliorations - Gestion des erreurs
- 🚫 Gestion des erreurs 403 dans toutes les pages admin (users, roles, dashboard)
- 🔄 Actualisation automatique de la page en cas de perte de permissions
- 💬 Message clair et temporisé avant actualisation (1,5 secondes)

### Corrections
- 🔧 Endpoint `/api/admin/preferences` corrigé (utilise `requireAdminAccess`)
- 📋 Traduction manquante `view` ajoutée dans admin.roles (FR/EN)
- 🌍 Traductions ajoutées pour `actionSettingsSmtpTest` et `actionPasswordChange`
- ✨ Cohérence des traductions entre dashboard et panel admin

### Technique
- 🛡️ Protection contre les appels API sans permissions appropriées
- 💾 Sauvegarde des préférences admin fonctionnelle (filtres tickets)
- 📊 Amélioration de la lisibilité des logs d'activité

## [1.6.2] - 2025-12-11

### Nouveautés - Configuration SMTP
- 📧 Configuration SMTP complète dans les paramètres admin (hôte, port, utilisateur, mot de passe)
- 🧪 Bouton "Tester la connexion SMTP" pour vérifier la configuration
- 📨 Email de test envoyé à l'administrateur connecté
- 🔒 Mot de passe SMTP masqué dans l'interface (affiché en `••••••••`)

### Nouveautés - Emails multilingues
- 🌍 Emails de réinitialisation de mot de passe en FR/EN selon la langue de l'utilisateur
- 🌍 Email de test SMTP dans la langue de l'admin
- 📝 Locale utilisateur stockée en base de données et utilisée pour les emails

### Sécurité - Système de réinitialisation de mot de passe
- 🔐 Tokens cryptographiques sécurisés (32 bytes aléatoires)
- ⏰ Expiration automatique des tokens après 1 heure
- 🔄 Un seul token valide par utilisateur (les anciens sont supprimés)
- 🚫 Rate limiting pour les utilisateurs : max 3 demandes par email par heure
- 🔒 Invalidation de toutes les sessions après changement de mot de passe
- ✅ Vérification de la force du mot de passe (score minimum requis)
- 📋 Logs d'audit complets pour toutes les actions
- 🛡️ Envoi des emails via Nodemailer

### Panel Admin
- 👑 Réinitialisation de mot de passe sans rate limit pour les admins (confiance + traçabilité)
- 📊 Logs d'audit avec IP et user-agent pour chaque action admin

### Corrections
- 🔗 Lien "Support" du footer redirige maintenant vers `/support` (au lieu de coming-soon)
- 🔐 Mot de passe SMTP non écrasé lors de la sauvegarde si non modifié (valeur `••••••••` ignorée)

---

## [1.6.1] - 2025-12-11

### Améliorations
- ⌨️ Focus automatique sur le champ de message après envoi (tickets)
- 💾 Sauvegarde des filtres de tickets admin en base de données (statut, priorité, catégorie)
- 🎨 Nouvelle UI pour la page Paramètres admin (navigation par catégories en grille)
- 📐 Espacement ajouté entre la navbar et le contenu dans l'admin
- 📐 Espacement corrigé entre titre et boutons sur la page Rôles
- 🌐 Traductions complètes des labels de paramètres système (FR/EN)
- ⚙️ Paramètres de sécurité maintenant fonctionnels (rate limit, durée session)

### Corrections
- 🔧 Rate limiting utilise maintenant les paramètres de la DB (tentatives max, durée blocage)
- 🔧 Durée de session configurable depuis les paramètres admin
- 🧹 Retrait des paramètres non implémentés (mode maintenance, stockage)

## [1.6.0] - 2025-12-11

### Nouveautés - Système de Support (En développement)
- 🎫 Système de tickets côté client (/support)
- 💬 Création de tickets avec catégorie, priorité et message
- 📋 Liste des tickets avec statuts et filtres
- 🗨️ Vue chat pour les conversations (style messagerie)
- ⚡ Messages en temps réel (optimistic updates + polling 5s)
- 🔒 Notes internes visibles uniquement par le staff (admin)
- 🎨 Aura colorée selon le type de message (réponse/note interne)
- 📱 Menu d'options mobile pour les tickets (sidebar responsive)

> ⚠️ Le système de tickets est fonctionnel mais encore en développement actif. Des fonctionnalités supplémentaires seront ajoutées.

### Interface
- 📜 Scrollbar personnalisée pour tout le site
- 📱 Menu mobile avec tous les outils (actifs + "Bientôt")
- 📱 Sidebar accessible via menu burger sur les pages dashboard/support
- 🖥️ Layout pleine hauteur pour les pages support, dashboard, alinks, avault
- 👤 Affichage du nom sur tous les messages (y compris les nôtres)
- 🏷️ Badge de rôle affiché pour les messages du staff

### Corrections
- Suppression des doublons dans le menu mobile
- Polling désactivé pour les tickets fermés (optimisation)
- Amélioration de la navigation mobile responsive

## [1.5.1] - 2025-12-10

### Améliorations
- Script `pnpm db:admin` maintenant interactif (demande email, mot de passe, nom pas à pas)

## [1.5.0] - 2025-12-10

### Nouveautés - Panel Administration
- Panel d'administration complet accessible via `/admin`
- Dashboard avec statistiques (utilisateurs, tickets, rôles, connexions)
- Gestion des utilisateurs (liste, détails, blocage, suppression, réinitialisation mot de passe)
- Système de rôles avec permissions granulaires (19 permissions)
- Système de tickets de support (création, réponse, notes internes, statuts)
- Paramètres système configurables
- Logs d'audit pour tracer toutes les actions admin

### Rôles et Permissions
- Rôles prédéfinis : Administrateur (système), Support
- Création de rôles personnalisés avec couleur et description
- 6 modules de permissions : Utilisateurs, Rôles, Tickets, Paramètres, Audit, Administration
- Système de hiérarchie par priorité (0 = plus important)
- Drag & drop pour réorganiser l'ordre des rôles
- Mode édition avec confirmation pour éviter les erreurs
- Protection : impossible de modifier son propre rôle

### Sécurité Admin
- Vérification des permissions côté serveur sur toutes les routes
- Hiérarchie des rôles : impossible d'agir sur un utilisateur/rôle de rang supérieur
- Protection des comptes système (Admin ne peut pas être supprimé)
- Impossible de se bloquer/supprimer soi-même
- Impossible d'attribuer un rôle supérieur au sien

### Interface Admin
- Sidebar responsive avec menu hamburger sur mobile
- Sélecteur de langue synchronisé avec le site principal
- Traductions complètes FR/EN pour tout le panel
- Logs d'activité traduits (20+ types d'actions)
- UI adaptative : éléments grisés/masqués selon les permissions
- Pagination et filtres sur les listes

### Scripts CLI
- `pnpm db:admin` : Créer le premier compte administrateur
- `pnpm db:seed` : Initialiser les permissions et rôles par défaut

## [1.4.0] - 2025-01-10

### Nouveautés
- AVault : Partage de notes chiffrées de bout en bout (AES-256)
- AVault : Protection par mot de passe optionnelle
- AVault : Auto-destruction après lecture (burn after read)
- AVault : Date d'expiration configurable
- AVault : Limite de vues configurable
- AVault : Dashboard de gestion des notes avec bouton copier le lien

### Sécurité
- Chiffrement AES-256 côté client
- Clé de déchiffrement stockée de manière sécurisée (accessible uniquement par le propriétaire)
- Protection contre les doubles appels API (React Strict Mode)

### Améliorations
- Traductions complètes FR/EN pour AVault
- Interface de visualisation des notes sécurisées

## [1.3.1] - 2025-01-09

### Corrections
- Attributs autocomplete sur tous les champs de formulaire
- Champ username caché pour l'accessibilité des formulaires de mot de passe
- Correction des erreurs 401 sur les pages non authentifiées
- Formulaire dans la modal d'édition des liens ALinks

### Améliorations
- Meilleure gestion des sessions pour éviter les déconnexions inattendues
- Sidebar fixe avec scroll uniquement sur le contenu

## [1.3.0] - 2025-01-09

### Nouveautés
- Multi-langue (Français / English)
- Détection automatique de la langue selon le pays
- Sauvegarde de la préférence de langue dans le profil
- Pages légales complètes (Mentions légales, Confidentialité, CGU, Cookies)
- Page Journal des modifications

### Améliorations
- Changement de langue sans rechargement de page
- Drapeaux SVG pour le sélecteur de langue

## [1.2.0] - 2025-01-08

### Nouveautés
- Thème synchronisé avec le compte utilisateur
- Page "Mot de passe oublié" (bientôt disponible)

### Sécurité
- Protection anti brute-force (rate limiting par IP)
- Headers HTTP sécurisés (CSP, X-Frame-Options, etc.)
- Invalidation des sessions au changement de mot de passe

## [1.1.0] - 2025-01-07

### Nouveautés
- Thèmes clair / sombre / système
- Favicon personnalisé
- Page "Coming Soon" pour les outils à venir

### Améliorations
- Amélioration de l'interface utilisateur

## [1.0.0] - 2025-01-06

### Nouveautés
- Système d'authentification complet (inscription, connexion, déconnexion)
- Dashboard utilisateur
- ALinks : création, édition, suppression de liens
- ALinks : statistiques détaillées (clics, appareils, navigateurs)
- ALinks : QR codes personnalisables (couleurs, fond transparent)
- ALinks : protection par mot de passe
- ALinks : date d'expiration et limite de clics
- Page de paramètres utilisateur
- Notifications toast personnalisées
- Popups de confirmation personnalisées

