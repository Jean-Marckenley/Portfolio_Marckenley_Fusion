
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const projectsRouter = Router();
export const publicProjectsRouter = Router();

const projectSchema = z.object({
    title: z.string().trim().min(1).max(150),
    description: z.string().default(""),
    technologies: z.array(z.string()).default([]),
    repo_url: z.string().url().nullable().optional(),
    demo_url: z.string().url().nullable().optional(),
    image_url: z.string().nullable().optional(),
    sort_order: z.number().int().default(0)
});

const idSchema = z.coerce.number().int().positive();



// GET - Projets publics d'un utilisateur
publicProjectsRouter.get("/:slug", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                p.id,
                p.title,
                p.description,
                p.technologies,
                p.repo_url,
                p.demo_url,
                p.image_url,
                p.sort_order
             FROM projects p
             JOIN users u ON u.id = p.user_id
             WHERE u.slug = $1
               AND u.is_public = TRUE
             ORDER BY p.sort_order, p.id`,
            [req.params.slug]
        );

        return res.json(result.rows);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Erreur du serveur"
        });
    }
});

// Toutes les routes sont réservées à l'administrateur
projectsRouter.use(requireAdmin);

// GET - Consulter les projets
projectsRouter.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM projects
       WHERE user_id = $1
       ORDER BY sort_order, id`,
            [res.locals.adminUserId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur du serveur" });
    }
});

// POST - Ajouter un projet
projectsRouter.post("/", async (req, res) => {
    try {
        const parsed = projectSchema.safeParse(req.body);

        if (!parsed.success) {
            console.error("Validation du projet :", parsed.error.issues);

            res.status(400).json({
                error: "Données du projet invalides",
                details: parsed.error.issues
            });
            return;
        }

        const p = parsed.data;

        const result = await pool.query(
            `INSERT INTO projects
       (user_id, title, description, technologies,
        repo_url, demo_url, image_url, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
            [
                res.locals.adminUserId,
                p.title,
                p.description,
                p.technologies,
                p.repo_url ?? null,
                p.demo_url ?? null,
                p.image_url ?? null,
                p.sort_order
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur du serveur" });
    }
});

// PUT - Modifier un projet
projectsRouter.put("/:id", async (req, res) => {
    try {
        const id = idSchema.safeParse(req.params.id);
        const parsed = projectSchema.safeParse(req.body);

        if (!id.success || !parsed.success) {
            res.status(400).json({ error: "Données invalides" });
            return;
        }

        const p = parsed.data;

        const result = await pool.query(
            `UPDATE projects
       SET title=$1, description=$2, technologies=$3,
           repo_url=$4, demo_url=$5, image_url=$6,
           sort_order=$7
       WHERE id=$8 AND user_id=$9
       RETURNING *`,
            [
                p.title,
                p.description,
                p.technologies,
                p.repo_url ?? null,
                p.demo_url ?? null,
                p.image_url ?? null,
                p.sort_order,
                id.data,
                res.locals.adminUserId
            ]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: "Projet introuvable" });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur du serveur" });
    }
});

// DELETE - Supprimer un projet
projectsRouter.delete("/:id", async (req, res) => {
    try {
        const id = idSchema.safeParse(req.params.id);

        if (!id.success) {
            res.status(400).json({ error: "Identifiant invalide" });
            return;
        }

        const result = await pool.query(
            `DELETE FROM projects
       WHERE id=$1 AND user_id=$2
       RETURNING id`,
            [id.data, res.locals.adminUserId]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: "Projet introuvable" });
            return;
        }

        res.json({ message: "Projet supprimé avec succès" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur du serveur" });
    }
});
