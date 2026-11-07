
import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { pool } from "../db.js";

export const requireAdmin: RequestHandler = async (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
        res.status(401).json({
            error: "Authentification requise"
        });
        return;
    }

    const token = authorization.slice(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        res.status(500).json({
            error: "Configuration du serveur manquante"
        });
        return;
    }

    try {
        const decoded = jwt.verify(token, secret);

        if (
            typeof decoded === "string" ||
            !decoded.sub ||
            !/^\d+$/.test(String(decoded.sub))
        ) {
            res.status(401).json({ error: "Token invalide" });
            return;
        }

        const userId = Number(decoded.sub);

        const result = await pool.query(
            "SELECT id, email, role FROM users WHERE id = $1",
            [userId]
        );

        const user = result.rows[0];

        if (!user || user.role !== "ADMIN") {
            res.status(403).json({
                error: "Accès réservé aux administrateurs"
            });
            return;
        }

        res.locals.adminUserId = user.id;
        res.locals.adminEmail = user.email;

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                error: "Token invalide ou expiré"
            });
            return;
        }

        console.error("Erreur de vérification admin :", error);
        res.status(500).json({
            error: "Erreur interne du serveur"
        });
    }
};
