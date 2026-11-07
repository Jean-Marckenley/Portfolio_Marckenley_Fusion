import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const publicContentRouter = Router();
export const adminContentRouter = Router();
adminContentRouter.use(requireAdmin);

const idSchema = z.coerce.number().int().positive();
const nullableUrl = z.union([z.string().url().max(2000), z.literal(""), z.null()]).optional();
const contactSchema = z.object({
 contact_email: z.union([z.string().email().max(255), z.literal("")]).default(""),
 linkedin_url: nullableUrl,
 github_url: nullableUrl,
 website_url: nullableUrl
});
const educationSchema = z.object({
 degree: z.string().trim().min(1).max(150),
 school: z.string().trim().min(1).max(150),
 start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
 end_date: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
 description: z.string().max(5000).default(""),
 sort_order: z.number().int().default(0)
});
const messageSchema = z.object({
 name: z.string().trim().min(2).max(150),
 email: z.string().email().max(255),
 subject: z.string().trim().min(2).max(200),
 message: z.string().trim().min(5).max(5000),
 website: z.string().max(200).optional() // champ piège anti-robot
});
const normalize = (v: string | null | undefined) => v?.trim() || null;

// GET public : formation et informations de contact d'un portfolio publié.
publicContentRouter.get("/:slug", async (req, res) => {
 try {
  const { rows } = await pool.query(
   `SELECT u.id, p.contact_email, p.linkedin_url, p.github_url, p.website_url
      FROM users u LEFT JOIN profiles p ON p.user_id=u.id
     WHERE u.slug=$1 AND u.is_public=TRUE`, [req.params.slug]);
  if (!rows.length) return res.status(404).json({error:"Portfolio introuvable"});
  const education = await pool.query(
   `SELECT id, degree, school, to_char(start_date,'YYYY-MM-DD') AS start_date,
      to_char(end_date,'YYYY-MM-DD') AS end_date, description, sort_order
      FROM education WHERE user_id=$1 ORDER BY sort_order,id`, [rows[0].id]);
  const { id, ...contact } = rows[0];
  return res.json({ contact, education: education.rows });
 } catch(e) { console.error(e); return res.status(500).json({error:"Erreur serveur"}); }
});

// POST public : envoyer un message au propriétaire du portfolio (stockage uniquement).
publicContentRouter.post("/:slug/messages", async (req, res) => {
 const parsed = messageSchema.safeParse(req.body);
 if (!parsed.success) return res.status(400).json({error:"Formulaire invalide"});
 if (parsed.data.website) return res.status(202).json({message:"Message reçu"});
 try {
  const owner = await pool.query("SELECT id FROM users WHERE slug=$1 AND is_public=TRUE",[req.params.slug]);
  if (!owner.rows.length) return res.status(404).json({error:"Portfolio introuvable"});
  const p=parsed.data;
  await pool.query(`INSERT INTO contact_messages (user_id,sender_name,sender_email,subject,message)
      VALUES ($1,$2,$3,$4,$5)`,[owner.rows[0].id,p.name,p.email,p.subject,p.message]);
  return res.status(201).json({message:"Message enregistré"});
 } catch(e) { console.error(e); return res.status(500).json({error:"Erreur serveur"}); }
});

// GET admin : paramètres de contact.
adminContentRouter.get("/contact", async (_req,res) => {
 try {
  const q=await pool.query(`SELECT contact_email,linkedin_url,github_url,website_url FROM profiles WHERE user_id=$1`,[res.locals.adminUserId]);
  return res.json(q.rows[0] ?? {contact_email:"",linkedin_url:null,github_url:null,website_url:null});
 } catch(e) { console.error(e); return res.status(500).json({error:"Erreur serveur"}); }
});

// PUT admin : création ou mise à jour des coordonnées, sans modifier le profil public existant.
adminContentRouter.put("/contact", async (req,res) => {
 const v=contactSchema.safeParse(req.body);
 if (!v.success) return res.status(400).json({error:"Coordonnées invalides"});
 const p=v.data;
 try {
  const q=await pool.query(`INSERT INTO profiles
    (user_id,full_name,contact_email,linkedin_url,github_url,website_url)
    VALUES ($1,(SELECT slug FROM users WHERE id=$1),$2,$3,$4,$5)
    ON CONFLICT (user_id) DO UPDATE SET contact_email=EXCLUDED.contact_email,
    linkedin_url=EXCLUDED.linkedin_url,github_url=EXCLUDED.github_url,
    website_url=EXCLUDED.website_url
    RETURNING contact_email,linkedin_url,github_url,website_url`,
    [res.locals.adminUserId,normalize(p.contact_email),normalize(p.linkedin_url),normalize(p.github_url),normalize(p.website_url)]);
  return res.json(q.rows[0]);
 } catch(e) { console.error(e); return res.status(500).json({error:"Erreur serveur"}); }
});

adminContentRouter.get("/education", async (_req,res) => {
 try {
  const q=await pool.query(`SELECT id,degree,school,to_char(start_date,'YYYY-MM-DD') AS start_date,
    to_char(end_date,'YYYY-MM-DD') AS end_date,description,sort_order
    FROM education WHERE user_id=$1 ORDER BY sort_order,id`,[res.locals.adminUserId]);
  return res.json(q.rows);
 } catch(e) { console.error(e); return res.status(500).json({error:"Erreur serveur"}); }
});
adminContentRouter.post("/education", async (req,res) => {
 const v=educationSchema.safeParse(req.body);
 if (!v.success) return res.status(400).json({error:"Formation invalide",details:v.error.issues});
 const p=v.data;
 try {
  const q=await pool.query(`INSERT INTO education (user_id,degree,school,start_date,end_date,description,sort_order)
    VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [res.locals.adminUserId,p.degree,p.school,p.start_date,p.end_date??null,p.description,p.sort_order]);
  return res.status(201).json({id:q.rows[0].id});
 } catch(e) { console.error(e); return res.status(500).json({error:"Erreur serveur"}); }
});
adminContentRouter.put("/education/:id", async (req,res) => {
 const id=idSchema.safeParse(req.params.id), v=educationSchema.safeParse(req.body);
 if(!id.success||!v.success) return res.status(400).json({error:"Formation invalide"});
 const p=v.data;
 try {
  const q=await pool.query(`UPDATE education SET degree=$1,school=$2,start_date=$3,end_date=$4,
    description=$5,sort_order=$6 WHERE id=$7 AND user_id=$8 RETURNING id`,
    [p.degree,p.school,p.start_date,p.end_date??null,p.description,p.sort_order,id.data,res.locals.adminUserId]);
  if(!q.rowCount) return res.status(404).json({error:"Formation introuvable"});
  return res.json({id:id.data});
 } catch(e) { console.error(e); return res.status(500).json({error:"Erreur serveur"}); }
});
adminContentRouter.delete("/education/:id", async(req,res)=>{
 const id=idSchema.safeParse(req.params.id);
 if(!id.success) return res.status(400).json({error:"Identifiant invalide"});
 try {
  const q=await pool.query("DELETE FROM education WHERE id=$1 AND user_id=$2 RETURNING id",[id.data,res.locals.adminUserId]);
  if(!q.rowCount) return res.status(404).json({error:"Formation introuvable"});
  return res.json({message:"Formation supprimée"});
 } catch(e) { console.error(e); return res.status(500).json({error:"Erreur serveur"}); }
});
adminContentRouter.get("/messages", async(_req,res)=>{
 try {
  const q=await pool.query(`SELECT id,sender_name,sender_email,subject,message,created_at
    FROM contact_messages WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,[res.locals.adminUserId]);
  return res.json(q.rows);
 } catch(e) { console.error(e); return res.status(500).json({error:"Erreur serveur"}); }
});
adminContentRouter.delete("/messages/:id", async(req,res)=>{
 const id=idSchema.safeParse(req.params.id);
 if(!id.success) return res.status(400).json({error:"Identifiant invalide"});
 try {
  const q=await pool.query("DELETE FROM contact_messages WHERE id=$1 AND user_id=$2 RETURNING id",[id.data,res.locals.adminUserId]);
  if(!q.rowCount) return res.status(404).json({error:"Message introuvable"});
  return res.json({message:"Message supprimé"});
 } catch(e) { console.error(e); return res.status(500).json({error:"Erreur serveur"}); }
});
