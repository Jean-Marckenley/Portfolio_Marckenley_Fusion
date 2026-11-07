# Portfolio Marckenley — Contact et Formation administrables

Cette archive est une version mise à jour du projet fourni, sans `node_modules`, sans `.env` ni secrets. **Conservez votre base PostgreSQL et votre `.env` existants.**

## Installation dans WebStorm

1. Faites une sauvegarde de votre dossier actuel. Décompressez le ZIP, puis ouvrez le dossier `Portfolio_Marckenley_Fusion` dans WebStorm.
2. Si vous aviez un fichier `.env` dans l’ancien dossier, copiez-le **localement** à la racine du nouveau projet; ne le publiez pas. Gardez votre clé JWT existante et vos identifiants PostgreSQL.
3. Démarrez Docker Desktop et vérifiez que `portfolio-postgres` et `portfolio-redis` sont actifs : `docker compose ps` depuis la racine du projet.
4. **Migration indispensable sur la base PostgreSQL existante**, depuis PowerShell à la racine du projet :

```powershell
Get-Content -Raw .\backend\db\contact_formation.sql | docker exec -i portfolio-postgres psql -v ON_ERROR_STOP=1 -U portfolio -d portfolio
```

Cette migration est idempotente et conserve les données et utilisateurs existants. Ne faites pas `docker compose down -v`. Le `init.sql` est également mis à jour pour une nouvelle installation mais **ne modifie pas automatiquement un volume PostgreSQL déjà initialisé**.

5. Depuis PowerShell dans `backend` : `npm install`, puis `npm run build`. Pour le serveur local, configurez `DATABASE_URL`, `REDIS_URL=redis://localhost:6380`, `JWT_SECRET`, `PORT=3000` dans la session qui lance `npm run dev` (ou une configuration d’exécution WebStorm).
6. Dans un second terminal `frontend` : `npm install`, puis `npm run build` et `npm run dev`. Vite utilise 5173, sinon 5174; ces deux origines sont autorisées localement par défaut.
7. Ouvrez `/admin/login`, puis l’interface administrateur. Vous verrez maintenant **Mes projets**, **Coordonnées de contact**, **Formation**, **Messages reçus**. La page d’accueil `/` affiche maintenant Formation et Contact depuis PostgreSQL.

## Tester

- Ajoutez une formation dans l’administration puis actualisez l’accueil : elle doit apparaître dans **Formation**.
- Enregistrez les coordonnées dans l’administration puis actualisez la section **Contact**.
- Envoyez un message test via Contact et vérifiez son arrivée sous **Messages reçus**. Les messages sont stockés dans PostgreSQL; aucun e-mail n’est envoyé automatiquement.
- Si l’accueil montre « Mes formations seront bientôt disponibles », ajoutez-en une dans le tableau de bord.

## Notes

- Les données initiales `portfolio.education` et `portfolio.email` ne sont plus utilisées pour ces deux sections : c’est désormais la base qui fait foi.
- Le propriétaire du contenu public est le compte dont le slug est `marckenley` et dont `is_public=true`.
- Avant une mise en production : ajouter des protections anti-spam et rate limiting, configurer HTTPS, et revoir la gestion des jetons et les politiques de conservation des messages.
- La partie Projets sur l’accueil reste alimentée par `portfolio.ts` : sa synchronisation publique n’est pas incluse dans cette mise à jour.
