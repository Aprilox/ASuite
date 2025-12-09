<div align="center">
  <img src=".github/assets/banner.svg" alt="ASuite Banner" width="100%" />
  
  <br />
  <br />
  
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Prisma-6.1-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
  
  <br />
  <br />
  
  <p><strong>Une suite d'outils collaboratifs moderne, sécurisée et professionnelle.</strong></p>
  <p><em>Inspirée de kSuite d'Infomaniak</em></p>
</div>

<br />

## ✨ Fonctionnalités

### ALinks - Raccourcisseur de liens ✅
- 🔗 Création de liens courts automatiques
- 📊 Statistiques détaillées (clics, appareils, navigateurs)
- 🔐 Protection par mot de passe
- ⏰ Date d'expiration configurable
- 🎯 Limite de clics
- 📱 QR codes personnalisables (couleurs, fond transparent)
- ✏️ Édition complète des liens

### Interface utilisateur ✅
- 🌍 Multi-langue (Français / English) avec détection automatique
- 🎨 Thèmes clair / sombre / système (synchronisé avec le compte)
- 🔔 Notifications toast personnalisées
- 💬 Popups de confirmation personnalisées
- 📱 Interface responsive
- ⚖️ Pages légales complètes (Mentions, Confidentialité, CGU, Cookies)

### Outils à venir
| Outil | Description | Status |
|-------|-------------|--------|
| **AVault** | Partage de notes chiffrées | 🔜 Bientôt |
| **ATransfer** | Transfert de fichiers jusqu'à 50 Go | 🔜 Bientôt |
| **ACalendar** | Gestion d'agenda et événements | 🔜 Bientôt |
| **AMail** | Messagerie sécurisée | 🔜 Bientôt |
| **ADrive** | Stockage cloud | 🔜 Bientôt |
| **AMeet** | Visioconférence | 🔜 Bientôt |
| **ADocs** | Traitement de texte collaboratif | 🔜 Bientôt |
| **ASheets** | Tableur en ligne | 🔜 Bientôt |
| **ASlides** | Présentations et diaporamas | 🔜 Bientôt |

## 🚀 Démarrage rapide

### Prérequis

- **Node.js** 20+ ([télécharger](https://nodejs.org/))
- **pnpm** 9+ (`npm install -g pnpm`)

### Installation

```bash
# Cloner le projet
git clone https://github.com/Aprilox/ASuite.git
cd ASuite

# Installer les dépendances
pnpm install

# Copier la configuration
cp env.example .env    # Linux/Mac
copy env.example .env  # Windows
```

### Configuration

Éditez le fichier `.env` avec vos paramètres. Configuration minimale :

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="votre-secret-change-moi"
NEXTAUTH_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> 📄 Voir `env.example` pour toutes les options disponibles.

### Lancement

```bash
# Générer le client Prisma
pnpm db:generate

# Créer les tables dans la base de données
pnpm db:push

# Lancer en développement
pnpm dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) 🎉

## 🗄️ Base de données

### Développement (SQLite - recommandé)

Aucune installation requise. La base de données est un fichier local.

```env
DATABASE_URL="file:./dev.db"
```

### Production (PostgreSQL)

```env
DATABASE_URL="postgresql://user:password@host:5432/asuite"
```

### Production (MySQL/MariaDB)

```env
DATABASE_URL="mysql://user:password@host:3306/asuite"
```

## 📁 Structure du projet

```
ASuite/
├── apps/
│   └── web/                    # Application Next.js principale
│       ├── public/             # Assets statiques (favicon, images)
│       ├── src/
│       │   ├── app/            # Routes et pages
│       │   ├── components/     # Composants React
│       │   ├── hooks/          # Hooks personnalisés
│       │   ├── lib/            # Utilitaires
│       │   ├── providers/      # Context providers (Auth, Theme)
│       │   └── types/          # Types TypeScript
│       └── ...
├── packages/
│   ├── database/               # Prisma ORM et client
│   ├── ui/                     # Composants UI partagés
│   └── utils/                  # Utilitaires partagés
├── env.example                 # Configuration exemple
├── turbo.json                  # Configuration Turborepo
└── pnpm-workspace.yaml         # Workspaces pnpm
```

## 🛠️ Scripts disponibles

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Lancer en mode développement |
| `pnpm build` | Build de production |
| `pnpm start` | Lancer en mode production (après build) |
| `pnpm lint` | Vérification du code |
| `pnpm db:generate` | Générer le client Prisma |
| `pnpm db:push` | Appliquer le schéma à la DB |
| `pnpm db:studio` | Interface graphique pour la DB |
| `pnpm clean` | Nettoyer les builds et node_modules |

## 🔐 Sécurité

- ✅ Authentification par session sécurisée
- ✅ Mots de passe hashés avec bcrypt (cost 12)
- ✅ Protection anti brute-force (rate limiting par IP)
- ✅ Headers HTTP sécurisés (CSP, X-Frame-Options, etc.)
- ✅ Invalidation des sessions au changement de mot de passe
- ✅ Protection CSRF
- ✅ Validation des entrées côté serveur
- ✅ Données isolées par utilisateur

## 🧪 Technologies

- **Frontend** : Next.js 14, React 18, Tailwind CSS
- **Backend** : Next.js API Routes
- **Base de données** : Prisma ORM (SQLite/PostgreSQL/MySQL)
- **Authentification** : Sessions + Cookies
- **Monorepo** : Turborepo + pnpm workspaces
- **Langage** : TypeScript

## 📝 Changelog

**Version actuelle : v1.3.0** - Multi-langue, pages légales, changelog dynamique

> 📋 Voir le [Journal des modifications complet](./CHANGELOG.md)

## 📄 Licence

**Propriétaire - Tous droits réservés**

Ce projet est sous licence propriétaire. Toute utilisation, modification ou distribution 
sans autorisation écrite préalable est strictement interdite.

📧 Contact : [contact@aprilox.fr](mailto:contact@aprilox.fr)

Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

---

<div align="center">
  <p>Fait avec ❤️ pour la productivité</p>
  <p>© 2025 Aprilox - Tous droits réservés</p>
</div>
