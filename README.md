
# Portfolio professionnel — Jean Marckenley CHARLES

## Présentation

Application web de portfolio professionnel développée dans
le cadre de ma formation en programmation-analyste
au Collège LaSalle.

Elle permet de présenter mon parcours professionnel,
mes compétences, mes formations et mes projets,
ainsi que de générer un CV au format PDF.

## Technologies

### Frontend
- React
- TypeScript
- Vite
- CSS

### Backend
- Node.js
- Express
- TypeScript
- API REST

### Base de données et cache
- PostgreSQL 16
- Redis 7

### Infrastructure
- Docker
- Docker Compose

## Fonctionnalités

- Page d'accueil professionnelle
- Portfolio public accessible avec un slug
- Authentification administrateur
- Gestion des projets
- Gestion des compétences techniques
- Gestion des expériences professionnelles
- Présentation des formations
- Formulaire de contact
- Génération d'un CV PDF
- Deux modèles de CV : classique et moderne
- Aperçu et téléchargement du CV
- Téléchargement public du CV
- Stockage des données dans PostgreSQL
- Utilisation de Redis pour la mise en cache

## Architecture

Le projet contient quatre services :

1. frontend : interface React et TypeScript
2. backend : API Express et TypeScript
3. postgres : base de données relationnelle
4. redis : système de cache

Le frontend communique avec l'API REST.
Le backend utilise PostgreSQL pour les données
et Redis pour la mise en cache.

## Structure du projet

Portfolio_Marckenley_Fusion/
├── backend/
│   ├── db/
│   │   └── init.sql
│   ├── src/
│   │   ├── routes/
│   │   ├── db.ts
│   │   ├── redis.ts
│   │   └── index.ts
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── images/
│   ├── src/
│   │   ├── admin/
│   │   ├── components/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md

## Prérequis

- Docker Desktop avec Docker Compose
- Git (facultatif pour récupérer le dépôt)

Pour le lancement manuel :
- Node.js compatible avec le projet
- npm

## Installation avec Docker

1. Récupérer le projet.
2. Ouvrir un terminal à la racine du projet.
3. Copier .env.example vers .env.
4. Remplacer les valeurs d'exemple par des secrets
   personnels et une configuration adaptée.
5. Démarrer les services :

```bash
docker compose up --build
```

## Accès à l'application

Frontend :
http://localhost:5173

Administration :
http://localhost:5173/admin

Portfolio public :
http://localhost:5173/p/marckenley

API :
http://localhost:3000

Vérification de l'API :
http://localhost:3000/api/health

CV public :
http://localhost:3000/api/public/marckenley/cv

## Utilisation

### Administration

Un compte autorisé peut se connecter à l'administration
pour gérer les informations professionnelles.

Les projets enregistrés dans PostgreSQL sont
récupérés automatiquement par le frontend.

### Portfolio public

Les visiteurs peuvent consulter le profil professionnel,
les compétences, les expériences, les projets,
les formations et les informations de contact.

### CV PDF

Le CV est généré à partir des informations enregistrées
dans la base de données.

Deux modèles sont disponibles :
- Classique
- Moderne

L'administration permet également de choisir
les sections du CV.

## Principales routes API

GET  /api/health
POST /api/auth/login

GET  /api/public/:slug
GET  /api/public/:slug/cv

GET  /api/public/projects/:slug
GET  /api/public/skills/:slug
GET  /api/public/experiences/:slug

GET  /api/content/:slug
POST /api/content/:slug/messages

Les routes d'administration nécessitent
une authentification appropriée.

## Vérifications

Après le démarrage des conteneurs :

```bash
docker compose ps
```

Pour consulter les journaux :

```bash
docker compose logs backend
docker compose logs frontend
```

Pour arrêter les services sans supprimer les données :

```bash
docker compose down
```

Attention : ne pas utiliser `docker compose down -v`
si les données PostgreSQL doivent être conservées.

## Sécurité

Les identifiants et secrets sont stockés dans
des variables d'environnement.

Les routes administratives sont protégées.
Les requêtes SQL utilisent des paramètres.

Le fichier .env ne doit pas être publié
dans un dépôt Git public.

Le téléchargement du CV public peut exposer
les coordonnées présentes dans le document.

## Auteur

Jean Marckenley CHARLES

Étudiant en programmation-analyste
Collège LaSalle — Montréal

Projet académique de portfolio professionnel
avec génération de CV PDF.
