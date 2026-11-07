# Portfolio Marckenley — fusion des deux archives

## Provenance
- **portfolio_Marckenley (1).zip** : inspiration graphique, rubriques, images transférées dans `frontend/public/images/`.
- **Projet(2).zip** : architecture imposée React/Vite/TypeScript + Express/PostgreSQL/Redis/Docker, conservée.
- Le frontend a été **adapté à Vite**, sans `next/image`, `react-scroll` ou composants spécifiques à Next.js.

## Lancement sous Windows (PowerShell)
```powershell
cd Portfolio_Marckenley_Fusion
Copy-Item .env.example .env
# Modifier POSTGRES_PASSWORD et SESSION_SECRET dans .env avant le lancement
 docker compose up --build
```
Frontend : http://localhost:5173
API : http://localhost:3000/api/health
Portfolio API exemple : http://localhost:5173/p/demo-etudiant

**Sans Docker** : dans `frontend`, exécuter `npm install` puis `npm run dev`. La page d'accueil fonctionne seule ; le portfolio public relié à la base nécessite les autres services.

## Personnaliser
Modifiez `frontend/src/portfolio.ts` (nom, description, compétences, projets, email, liens). Les visuels `Projet1.jpg`, `Projet2.jpg`, `Projet3.jpg` proviennent du premier portfolio et sont **illustratifs**, pas des captures vérifiées des projets.

## Périmètre restant par rapport au cahier des charges
Cette fusion intègre un site public responsive et conserve une API d'exemple avec PostgreSQL + cache Redis. **Elle n'implémente pas encore** : inscription/connexion sécurisées, tableau de bord CRUD, affichage dynamique de toutes les rubriques à partir de la BD, réglage public/privé depuis une interface, création/aperçu/cache de CV PDF en deux modèles et tests automatisés du système complet. Les routes CV existantes retournent toujours HTTP 501.

Le cahier des charges d'origine est inclus dans `Cahier_des_charges.docx`.
