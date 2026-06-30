# BI Platform - Business Intelligence Web Platform

Plateforme web moderne de gestion, analyse et visualisation de données issues de fichiers Excel/CSV/ODS.

## Stack Technique

**Frontend:** React 19, Next.js 14, TypeScript, Tailwind CSS, Recharts, Leaflet  
**Backend:** Node.js, Express.js, TypeScript, Prisma ORM  
**Base de données:** PostgreSQL  
**Conteneurisation:** Docker & Docker Compose  

## Architecture

Chaque fichier importé conserve son nom, ses feuilles, ses colonnes et ses types de données. Chaque feuille Excel devient automatiquement une table PostgreSQL dynamique.

### Fonctionnalités principales

- **Import** de fichiers Excel (.xlsx, .xls), CSV, ODS
- **CRUD complet** sur les données avec recherche, tri, pagination, filtres
- **Tableau de bord** interactif avec KPI, statistiques, graphiques
- **Analytique** : histogrammes, camemberts, courbes, heatmap, treemap, sunburst, radar
- **Cartographie** : Leaflet + OpenStreetMap avec affichage GPS
- **Moteur de recherche** global et multicritère
- **Exports** : Excel, CSV, PDF, JSON
- **Rapports** PDF automatiques et personnalisés
- **Authentification** JWT + OAuth + 2FA
- **Gestion des utilisateurs** et des permissions (Super Admin, Admin, Analyste, Agent, Viewer)
- **Audit** complet des actions
- **Internationalisation** : Français, English, العربية (RTL)
- **API REST** documentée (Swagger)

## Installation rapide

### Prérequis

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- npm ou yarn

### 1. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Accès

- Frontend : http://localhost:3000
- Backend API : http://localhost:5000/api
- Documentation Swagger : http://localhost:5000/api-docs

### 4. Comptes par défaut

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@biplatform.com | admin123 | Super Admin |
| analyst@biplatform.com | admin123 | Analyste |

### 5. Seed

```bash
cd backend
npx tsx src/seed.ts
```

## Docker

```bash
docker-compose up -d
```

## Structure du projet

```
.
├── backend/
│   ├── prisma/               # Schéma Prisma
│   ├── src/
│   │   ├── config/           # Configuration (Swagger, etc.)
│   │   ├── controllers/      # Contrôleurs API
│   │   ├── middlewares/      # Auth, validation, upload, error
│   │   ├── routes/           # Routes API
│   │   ├── services/         # Importer, Dynamic Table, Reports
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Helpers, logger, audit
│   │   ├── index.ts          # Point d'entrée serveur
│   │   └── seed.ts           # Script de seed
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/              # Pages Next.js (App Router)
│   │   ├── components/       # Composants React
│   │   ├── hooks/            # Hooks Zustand
│   │   ├── i18n/             # Traductions (FR/EN/AR)
│   │   ├── lib/              # API client, utils
│   │   ├── styles/           # Tailwind CSS
│   │   └── types/            # TypeScript types
│   └── package.json
├── docker-compose.yml
├── Dockerfile
├── Dockerfile.backend
└── Dockerfile.frontend
```

## API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/verify-2fa` - Vérification 2FA
- `POST /api/auth/refresh` - Raffraîchir token
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Profil utilisateur

### Import
- `POST /api/import/upload` - Importer un fichier
- `GET /api/import/files` - Liste des fichiers
- `GET /api/import/files/:id` - Détails d'un fichier
- `DELETE /api/import/files/:id` - Supprimer un fichier
- `GET /api/import/sheets/:id` - Données d'une feuille
- `GET /api/import/sheets/:id/columns` - Colonnes d'une feuille

### Données (CRUD)
- `POST /api/data/:sheetId` - Créer un enregistrement
- `PUT /api/data/:sheetId/:id` - Modifier
- `DELETE /api/data/:sheetId/:id` - Supprimer
- `GET /api/data/:sheetId/:id` - Consulter
- `POST /api/data/:sheetId/:id/duplicate` - Dupliquer
- `POST /api/data/:sheetId/bulk-delete` - Suppression multiple

### Analytics
- `GET /api/analytics/dashboard` - Statistiques générales
- `GET /api/analytics/chart` - Données pour graphiques
- `GET /api/analytics/advanced` - Analytics avancé
- `GET /api/analytics/timeseries` - Séries temporelles

### Exports
- `GET /api/exports/:sheetId/excel` - Export Excel
- `GET /api/exports/:sheetId/csv` - Export CSV
- `GET /api/exports/:sheetId/pdf` - Export PDF
- `GET /api/exports/:sheetId/json` - Export JSON

### Rapports
- `GET/POST /api/reports` - CRUD Rapports
- `POST /api/reports/:id/generate` - Générer rapport PDF

### Dashboard
- `GET/POST /api/dashboards` - CRUD Dashboards
- `GET /api/dashboards/default` - Dashboard par défaut

### Administration
- `GET /api/admin/users` - Liste utilisateurs
- `POST /api/admin/users` - Créer utilisateur
- `GET /api/admin/audit-logs` - Journaux d'audit
- `GET /api/admin/stats` - Statistiques système

### Recherche & Cartographie
- `GET /api/search/global?q=` - Recherche globale
- `POST /api/search/advanced` - Recherche avancée
- `GET /api/map/data` - Données cartographiques
- `GET /api/map/regions` - Données par région
