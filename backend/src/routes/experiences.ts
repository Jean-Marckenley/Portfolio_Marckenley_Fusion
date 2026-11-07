
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const publicExperiencesRouter = Router();
export const adminExperiencesRouter = Router();

adminExperiencesRouter.use(requireAdmin);

// Validation des dates au format YYYY-MM-DD
const dateSchema = z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "La date doit être au format AAAA-MM-JJ"
);

// Validation des données d'une expérience
const experienceSchema = z.object({
    position: z.string().trim().min(1).max(150),
    company: z.string().trim().min(1).max(150),
    start_date: dateSchema,
    end_date: dateSchema.nullable().optional(),
    description: z.string().trim().nullable().optional(),
    sort_order: z.number().int().default(0)
}).refine(
    (data) => !data.end_date || data.end_date >= data.start_date,
    {
        message: "La date de fin doit être postérieure ou égale à la date de début",
        path: ["end_date"]
    }
);

const idSchema = z.coerce.number().int().positive();

// GET - Expériences publiques
publicExperiencesRouter.get("/:slug", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT e.id, e.position, e.company,
                    e.start_date, e.end_date,
                    e.description, e.sort_order
             FROM experiences e
             JOIN users u ON u.id = e.user_id
             WHERE u.slug = $1 AND u.is_public = TRUE
             ORDER BY e.sort_order, e.start_date DESC, e.id`,
            [req.params.slug]
        );

        return res.json(result.rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Erreur serveur"
        });
    }
});

// GET - Expériences de l'administrateur
adminExperiencesRouter.get("/", async (_req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, position, company,
                    start_date, end_date,
                    description, sort_order
             FROM experiences
             WHERE user_id = $1
             ORDER BY sort_order, start_date DESC, id`,
            [res.locals.adminUserId]
        );

        return res.json(result.rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Erreur serveur"
        });
    }
});

// POST - Ajouter une expérience
adminExperiencesRouter.post("/", async (req, res) => {
    const parsed = experienceSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            error: "Expérience invalide",
            details: parsed.error.issues
        });
    }

    const experience = parsed.data;

    try {
        const result = await pool.query(
            `INSERT INTO experiences
                (user_id, position, company, start_date,
                 end_date, description, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                res.locals.adminUserId,
                experience.position,
                experience.company,
                experience.start_date,
                experience.end_date ?? null,
                experience.description ?? null,
                experience.sort_order
            ]
        );

        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Erreur serveur"
        });
    }
});

// PUT - Modifier une expérience
adminExperiencesRouter.put("/:id", async (req, res) => {
    const id = idSchema.safeParse(req.params.id);
    const parsed = experienceSchema.safeParse(req.body);

    if (!id.success || !parsed.success) {
        return res.status(400).json({
            error: "Données invalides",
            details: parsed.success ? [] : parsed.error.issues
        });
    }

    const experience = parsed.data;

    try {
        const result = await pool.query(
            `UPDATE experiences
             SET position = $1,
                 company = $2,
                 start_date = $3,
                 end_date = $4,
                 description = $5,
                 sort_order = $6
             WHERE id = $7 AND user_id = $8
             RETURNING *`,
            [
                experience.position,
                experience.company,
                experience.start_date,
                experience.end_date ?? null,
                experience.description ?? null,
                experience.sort_order,
                id.data,
                res.locals.adminUserId
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: "Expérience introuvable"
            });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Erreur serveur"
        });
    }
});

// DELETE - Supprimer une expérience
adminExperiencesRouter.delete("/:id", async (req, res) => {
    const id = idSchema.safeParse(req.params.id);

    if (!id.success) {
        return res.status(400).json({
            error: "Identifiant invalide"
        });
    }

    try {
        const result = await pool.query(
            `DELETE FROM experiences
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [id.data, res.locals.adminUserId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: "Expérience introuvable"
            });
        }

        return res.json({
            message: "Expérience supprimée"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Erreur serveur"
        });
    }
});
