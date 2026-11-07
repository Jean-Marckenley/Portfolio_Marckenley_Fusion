
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { connectRedis } from "./redis.js";

// Routes principales
import { healthRouter } from "./routes/health.js";
import { publicRouter } from "./routes/public.js";
import { cvRouter } from "./routes/cv.js";
import { authRouter } from "./routes/auth.js";

// Projets
import {
  projectsRouter,
  publicProjectsRouter
} from "./routes/projects.js";

// Formations, contenu et contact
import {
  adminContentRouter,
  publicContentRouter
} from "./routes/content.js";

// Compétences
import {
  publicSkillsRouter,
  adminSkillsRouter
} from "./routes/skills.js";

// Expériences professionnelles
import {
  publicExperiencesRouter,
  adminExperiencesRouter
} from "./routes/experiences.js";

// ========================================
// CONFIGURATION EXPRESS
// ========================================

const app = express();

const port = Number(process.env.PORT ?? 3000);

// Sécurité HTTP
app.use(helmet());

// Autoriser les adresses du frontend
app.use(
    cors({
      origin: (
          process.env.CORS_ORIGIN ??
          "http://localhost:5173,http://localhost:5174"
      )
          .split(",")
          .map(value => value.trim())
    })
);

// Analyser les requêtes JSON
app.use(express.json({ limit: "100kb" }));

// ========================================
// ROUTES API
// ========================================

// Vérification PostgreSQL et Redis
app.use("/api/health", healthRouter);

// Authentification
app.use("/api/auth", authRouter);

// Portfolio public et téléchargement du CV
app.use("/api/public", publicRouter);

// Génération privée des CV
app.use("/api/cv", cvRouter);

// Gestion des projets
app.use("/api/projects", projectsRouter);
app.use("/api/public/projects", publicProjectsRouter);

// Formations, contact et contenu
app.use("/api/content", publicContentRouter);
app.use("/api/admin/content", adminContentRouter);

// Gestion des compétences
app.use("/api/public/skills", publicSkillsRouter);
app.use("/api/admin/skills", adminSkillsRouter);

// Gestion des expériences professionnelles
app.use("/api/public/experiences", publicExperiencesRouter);
app.use("/api/admin/experiences", adminExperiencesRouter);

// ========================================
// GESTION DES ROUTES INCONNUES
// ========================================

app.use((_req, res) => {
  res.status(404).json({
    error: "Route API introuvable"
  });
});

// ========================================
// DÉMARRAGE DU SERVEUR
// ========================================

async function start() {
  await connectRedis();

  app.listen(port, () => {
    console.log(
        `API démarrée sur le port ${port}`
    );
  });
}

start().catch(error => {
  console.error(
      "Erreur de démarrage du serveur :",
      error
  );

  process.exit(1);
});
