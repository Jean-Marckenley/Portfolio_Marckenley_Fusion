
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const publicSkillsRouter = Router();
export const adminSkillsRouter = Router();

adminSkillsRouter.use(requireAdmin);

const skillSchema = z.object({
    name: z.string().trim().min(1).max(100),
    category: z.string().trim().max(50).nullable().optional(),
    level: z.number().int().min(1).max(5).nullable().optional(),
    sort_order: z.number().int().default(0)
});

const idSchema = z.coerce.number().int().positive();

// GET - Compétences publiques
publicSkillsRouter.get("/:slug", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.id, s.name, s.category, s.level, s.sort_order
       FROM skills s
       JOIN users u ON u.id = s.user_id
       WHERE u.slug = $1 AND u.is_public = TRUE
       ORDER BY s.sort_order, s.id`,
            [req.params.slug]
        );

        return res.json(result.rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
});

// GET - Compétences de l'administrateur
adminSkillsRouter.get("/", async (_req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, category, level, sort_order
       FROM skills
       WHERE user_id = $1
       ORDER BY sort_order, id`,
            [res.locals.adminUserId]
        );

        return res.json(result.rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
});

// POST - Ajouter une compétence
adminSkillsRouter.post("/", async (req, res) => {
    const parsed = skillSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            error: "Compétence invalide",
            details: parsed.error.issues
        });
    }

    const skill = parsed.data;

    try {
        const result = await pool.query(
            `INSERT INTO skills
       (user_id, name, category, level, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [
                res.locals.adminUserId,
                skill.name,
                skill.category || null,
                skill.level ?? null,
                skill.sort_order
            ]
        );

        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
});

// PUT - Modifier une compétence
adminSkillsRouter.put("/:id", async (req, res) => {
    const id = idSchema.safeParse(req.params.id);
    const parsed = skillSchema.safeParse(req.body);

    if (!id.success || !parsed.success) {
        return res.status(400).json({
            error: "Données invalides"
        });
    }

    const skill = parsed.data;

    try {
        const result = await pool.query(
            `UPDATE skills
       SET name = $1,
           category = $2,
           level = $3,
           sort_order = $4
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
            [
                skill.name,
                skill.category || null,
                skill.level ?? null,
                skill.sort_order,
                id.data,
                res.locals.adminUserId
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: "Compétence introuvable"
            });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
});

// DELETE - Supprimer une compétence
adminSkillsRouter.delete("/:id", async (req, res) => {
    const id = idSchema.safeParse(req.params.id);

    if (!id.success) {
        return res.status(400).json({
            error: "Identifiant invalide"
        });
    }

    try {
        const result = await pool.query(
            `DELETE FROM skills
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
            [id.data, res.locals.adminUserId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: "Compétence introuvable"
            });
        }

        return res.json({
            message: "Compétence supprimée"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
});
