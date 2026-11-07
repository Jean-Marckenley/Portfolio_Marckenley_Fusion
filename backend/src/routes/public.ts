
import { Router } from "express";
import { createHash } from "node:crypto";
import { pool } from "../db.js";
import { redis } from "../redis.js";
import { loadCvData, generatePdf } from "./cv.js";

export const publicRouter = Router();

// Durée de conservation dans Redis
const CACHE_TTL_SECONDS = 60 * 5;
const CV_CACHE_TTL_SECONDS = 60 * 60;

// Types utilisés pour générer le CV
type CvTemplate = "classic" | "modern";

type CvSection =
    | "profile"
    | "experiences"
    | "education"
    | "skills"
    | "projects";

const CV_SECTIONS: CvSection[] = [
  "profile",
  "experiences",
  "education",
  "skills",
  "projects"
];

// ========================================
// TÉLÉCHARGER UN CV PUBLIC
// GET /api/public/:slug/cv
// ========================================

publicRouter.get("/:slug/cv", async (req, res) => {
  try {
    const { slug } = req.params;

    // Vérifier que le compte existe et est public
    const userResult = await pool.query(
        `SELECT id
             FROM users
             WHERE slug = $1
               AND is_public = TRUE`,
        [slug]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: "Portfolio introuvable ou privé"
      });
    }

    const userId = Number(userResult.rows[0].id);

    // Récupérer les informations dans PostgreSQL
    const data = await loadCvData(userId);

    if (!data.user) {
      return res.status(404).json({
        error: "Utilisateur introuvable"
      });
    }

    // Choisir le modèle de CV
    const template: CvTemplate =
        req.query.template === "modern"
            ? "modern"
            : "classic";

    // Sections du CV public
    const sections: CvSection[] = [...CV_SECTIONS];

    // Empreinte des données pour le cache Redis
    const version = createHash("sha256")
        .update(JSON.stringify(data))
        .digest("hex");

    const cacheKey = [
      "cv-public",
      userId,
      template,
      sections.join("-"),
      version
    ].join(":");

    let pdf: Buffer | null = null;

    // ========================================
    // LECTURE DU CACHE REDIS
    // ========================================

    if (redis.isReady) {
      try {
        const cached = await redis.get(cacheKey);

        if (cached) {
          pdf = Buffer.from(cached, "base64");

          console.log(
              "CV public récupéré depuis Redis"
          );
        }
      } catch (error) {
        console.error(
            "Erreur lecture cache CV :",
            error
        );
      }
    }

    // ========================================
    // GÉNÉRATION DU PDF
    // ========================================

    if (!pdf) {
      pdf = await generatePdf(
          data,
          template,
          sections
      );

      // Enregistrer le PDF dans Redis
      if (redis.isReady) {
        try {
          await redis.setEx(
              cacheKey,
              CV_CACHE_TTL_SECONDS,
              pdf.toString("base64")
          );

          console.log(
              "CV public enregistré dans Redis"
          );
        } catch (error) {
          console.error(
              "Erreur écriture cache CV :",
              error
          );
        }
      }
    }

    // ========================================
    // NOM DU FICHIER PDF
    // ========================================

    const fullName =
        data.profile?.full_name ||
        data.user.slug ||
        "Portfolio";

    const safeName = String(fullName)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "");

    const filename =
        `CV_${safeName || "Portfolio"}.pdf`;

    // ========================================
    // ENVOYER LE PDF AU NAVIGATEUR
    // ========================================

    res.setHeader(
        "Content-Type",
        "application/pdf"
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
    );

    res.setHeader(
        "Content-Length",
        pdf.length
    );

    res.setHeader(
        "Cache-Control",
        "no-store"
    );

    return res.end(pdf);

  } catch (error) {
    console.error(
        "Erreur téléchargement CV public :",
        error
    );

    return res.status(500).json({
      error: "Impossible de télécharger le CV"
    });
  }
});

// ========================================
// CONSULTER UN PORTFOLIO PUBLIC
// GET /api/public/:slug
// ========================================

publicRouter.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    // Toujours vérifier que le portfolio est public
    // avant de lire son cache Redis
    const userResult = await pool.query(
        `SELECT id
             FROM users
             WHERE slug = $1
               AND is_public = TRUE`,
        [slug]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: "Portfolio introuvable ou privé"
      });
    }

    const cacheKey = `portfolio:${slug}`;

    // ========================================
    // RÉCUPÉRER LE PROFIL DEPUIS REDIS
    // ========================================

    if (redis.isReady) {
      try {
        const cached = await redis.get(cacheKey);

        if (cached) {
          return res.json({
            source: "cache",
            ...JSON.parse(cached)
          });
        }
      } catch (error) {
        console.error(
            "Erreur lecture cache portfolio :",
            error
        );
      }
    }

    // ========================================
    // RÉCUPÉRER LE PROFIL DEPUIS POSTGRESQL
    // ========================================

    const result = await pool.query(
        `SELECT
                u.slug,
                p.full_name,
                p.headline,
                p.bio
             FROM users u
             LEFT JOIN profiles p
                 ON p.user_id = u.id
             WHERE u.slug = $1
               AND u.is_public = TRUE`,
        [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Portfolio introuvable"
      });
    }

    const profile = result.rows[0];

    // ========================================
    // ENREGISTRER LE PROFIL DANS REDIS
    // ========================================

    if (redis.isReady) {
      try {
        await redis.set(
            cacheKey,
            JSON.stringify(profile),
            {
              EX: CACHE_TTL_SECONDS
            }
        );

        console.log(
            "Portfolio enregistré dans Redis"
        );
      } catch (error) {
        console.error(
            "Erreur écriture cache portfolio :",
            error
        );
      }
    }

    return res.json({
      source: "db",
      ...profile
    });

  } catch (error) {
    console.error(
        "Erreur portfolio public :",
        error
    );

    return res.status(500).json({
      error: "Erreur du serveur"
    });
  }
});
