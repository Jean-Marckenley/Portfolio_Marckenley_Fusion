
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const authRouter = Router();

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

// Connexion de l'utilisateur
authRouter.post("/login", async (req, res) => {
    try {
        const validation = loginSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                error: "Email ou mot de passe invalide"
            });
        }

        const { email, password } = validation.data;

        const result = await pool.query(
            `SELECT id, email, password_hash, slug
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: "Identifiants incorrects"
            });
        }

        const user = result.rows[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!validPassword) {
            return res.status(401).json({
                error: "Identifiants incorrects"
            });
        }

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            console.error("JWT_SECRET manquant");
            return res.status(500).json({
                error: "Configuration du serveur manquante"
            });
        }

        const token = jwt.sign(
            { sub: String(user.id) },
            secret,
            { expiresIn: "1h" }
        );

        return res.json({
            message: "Connexion réussie",
            token,
            user: {
                id: user.id,
                email: user.email,
                slug: user.slug
            }
        });

    } catch (error) {
        console.error("Erreur de connexion :", error);

        return res.status(500).json({
            error: "Erreur interne du serveur"
        });
    }
});

// Vérification de l'administrateur connecté
authRouter.get("/me", requireAdmin, (req, res) => {
    return res.json({
        authenticated: true,
        role: "ADMIN",
        user: {
            id: res.locals.adminUserId,
            email: res.locals.adminEmail
        }
    });
});
