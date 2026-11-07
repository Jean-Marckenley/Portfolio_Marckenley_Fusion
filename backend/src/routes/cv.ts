
import { Router, type Request, type Response } from "express";
import PDFDocument from "pdfkit";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const cvRouter = Router();

// Seul l'utilisateur authentifié peut générer son CV.
cvRouter.use(requireAdmin);

type CvTemplate = "classic" | "modern";

type CvSection =
    | "profile"
    | "experiences"
    | "education"
    | "skills"
    | "projects";

const allSections: CvSection[] = [
  "profile",
  "experiences",
  "education",
  "skills",
  "projects"
];

type CvData = {
  user: any;
  profile: any;
  experiences: any[];
  education: any[];
  skills: any[];
  projects: any[];
};

function formatDate(value: string | Date | null): string {
  if (!value) return "Aujourd'hui";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("fr-CA", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
}

// Récupérer les informations PostgreSQL
export async function loadCvData(userId: number): Promise<CvData> {
  const [
    users,
    profiles,
    experiences,
    education,
    skills,
    projects
  ] = await Promise.all([
    pool.query(
        `SELECT id, email, slug
             FROM users
             WHERE id = $1`,
        [userId]
    ),

    pool.query(
        `SELECT *
             FROM profiles
             WHERE user_id = $1
             LIMIT 1`,
        [userId]
    ),

    pool.query(
        `SELECT *
             FROM experiences
             WHERE user_id = $1
             ORDER BY sort_order, start_date DESC`,
        [userId]
    ),

    pool.query(
        `SELECT *
             FROM education
             WHERE user_id = $1
             ORDER BY sort_order, start_date DESC`,
        [userId]
    ),

    pool.query(
        `SELECT *
             FROM skills
             WHERE user_id = $1
             ORDER BY sort_order, id`,
        [userId]
    ),

    pool.query(
        `SELECT *
             FROM projects
             WHERE user_id = $1
             ORDER BY sort_order, id`,
        [userId]
    )
  ]);

  return {
    user: users.rows[0],
    profile: profiles.rows[0] ?? null,
    experiences: experiences.rows,
    education: education.rows,
    skills: skills.rows,
    projects: projects.rows
  };
}

// Génération PDF : deux modèles
export async function generatePdf(
    data: CvData,
    template: CvTemplate,
    sections: CvSection[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: 45,
        bottom: 45,
        left: 48,
        right: 48
      },
      bufferPages: true
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on("error", reject);

    const modern = template === "modern";

    const primary = modern ? "#173554" : "#202020";
    const secondary = modern ? "#1976A3" : "#555555";

    const fullName =
        data.profile?.full_name ||
        data.user?.slug ||
        "Mon CV";

    const headline =
        data.profile?.headline ||
        "Profil professionnel";

    // EN-TÊTE
    if (modern) {
      doc.rect(0, 0, 595, 155)
          .fill(primary);

      doc.fillColor("#FFFFFF")
          .font("Helvetica-Bold")
          .fontSize(23)
          .text(fullName, 48, 47, {
            width: 495
          });

      doc.font("Helvetica")
          .fontSize(12)
          .text(headline, 48, 91, {
            width: 495
          });

      doc.y = 180;
    } else {
      doc.fillColor(primary)
          .font("Helvetica-Bold")
          .fontSize(23)
          .text(fullName, {
            align: "center"
          });

      doc.font("Helvetica")
          .fontSize(12)
          .fillColor(secondary)
          .text(headline, {
            align: "center"
          });

      doc.moveDown();
    }

    const contact = [
      data.user?.email,
      data.profile?.phone
    ].filter(Boolean).join(" | ");

    if (contact) {
      doc.fillColor(secondary)
          .font("Helvetica")
          .fontSize(9)
          .text(contact, {
            align: "center"
          });

      doc.moveDown(1.2);
    }

    // Titres des sections
    function sectionTitle(title: string) {
      doc.moveDown(0.8);

      doc.fillColor(primary)
          .font("Helvetica-Bold")
          .fontSize(13)
          .text(title.toUpperCase(), {
            continued: false
          });

      doc.moveDown(0.35);

      if (modern) {
        doc.strokeColor("#1976A3")
            .lineWidth(1)
            .moveTo(48, doc.y)
            .lineTo(547, doc.y)
            .stroke();

        doc.moveDown(0.6);
      }
    }

    function paragraph(text: string) {
      doc.fillColor("#303030")
          .font("Helvetica")
          .fontSize(10)
          .text(text, {
            lineGap: 3
          });

      doc.moveDown(0.5);
    }

    // PROFIL
    if (sections.includes("profile")) {
      sectionTitle("Profil");

      paragraph(
          data.profile?.bio ||
          "Présentation professionnelle à compléter."
      );
    }

    // EXPÉRIENCES
    if (
        sections.includes("experiences") &&
        data.experiences.length > 0
    ) {
      sectionTitle("Expériences professionnelles");

      for (const experience of data.experiences) {
        doc.fillColor(primary)
            .font("Helvetica-Bold")
            .fontSize(11)
            .text(
                `${experience.position} — ${experience.company}`
            );

        doc.fillColor(secondary)
            .font("Helvetica")
            .fontSize(9)
            .text(
                `${formatDate(experience.start_date)} – ` +
                `${formatDate(experience.end_date)}`
            );

        if (experience.description) {
          paragraph(experience.description);
        }

        doc.moveDown(0.4);
      }
    }

    // FORMATIONS
    if (
        sections.includes("education") &&
        data.education.length > 0
    ) {
      sectionTitle("Formation");

      for (const item of data.education) {
        doc.fillColor(primary)
            .font("Helvetica-Bold")
            .fontSize(11)
            .text(`${item.degree} — ${item.school}`);

        doc.fillColor(secondary)
            .font("Helvetica")
            .fontSize(9)
            .text(
                `${formatDate(item.start_date)} – ` +
                `${formatDate(item.end_date)}`
            );

        if (item.description) {
          paragraph(item.description);
        }

        doc.moveDown(0.4);
      }
    }

    // COMPÉTENCES
    if (
        sections.includes("skills") &&
        data.skills.length > 0
    ) {
      sectionTitle("Compétences");

      const skillNames = data.skills.map(skill => {
        return skill.level
            ? `${skill.name} (${skill.level}/5)`
            : skill.name;
      });

      paragraph(skillNames.join(" • "));
    }

    // PROJETS
    if (
        sections.includes("projects") &&
        data.projects.length > 0
    ) {
      sectionTitle("Projets");

      for (const project of data.projects) {
        doc.fillColor(primary)
            .font("Helvetica-Bold")
            .fontSize(11)
            .text(project.title);

        if (project.description) {
          paragraph(project.description);
        }

        if (Array.isArray(project.technologies)) {
          doc.fillColor(secondary)
              .font("Helvetica")
              .fontSize(9)
              .text(project.technologies.join(", "));
        }

        if (project.repo_url) {
          doc.fontSize(9)
              .text(project.repo_url);
        }

        if (project.demo_url) {
          doc.fontSize(9)
              .text(project.demo_url);
        }

        doc.moveDown(0.6);
      }
    }

    doc.end();
  });
}

async function handleCv(
    req: Request,
    res: Response,
    disposition: "inline" | "attachment"
) {
  try {
    const template: CvTemplate =
        req.query.template === "modern"
            ? "modern"
            : "classic";

    const sectionQuery = req.query.sections;

    const sections: CvSection[] =
        typeof sectionQuery === "string"
            ? allSections.filter(section =>
                sectionQuery.split(",").includes(section)
            )
            : allSections;

    const userId = Number(res.locals.adminUserId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        error: "Utilisateur non authentifié"
      });
    }

    const data = await loadCvData(userId);

    if (!data.user) {
      return res.status(404).json({
        error: "Utilisateur introuvable"
      });
    }

    const pdf = await generatePdf(
        data,
        template,
        sections
    );

    const fullName =
        data.profile?.full_name ||
        data.user.slug ||
        "Utilisateur";

    const safeName = String(fullName)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "");

    const fileName = `CV_${safeName || "Utilisateur"}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdf.length);
    res.setHeader(
        "Content-Disposition",
        `${disposition}; filename="${fileName}"`
    );
    res.setHeader("Cache-Control", "no-store");

    return res.end(pdf);
  } catch (error) {
    console.error("Erreur génération CV :", error);

    return res.status(500).json({
      error: "Impossible de générer le CV"
    });
  }
}

// Prévisualisation du PDF
cvRouter.get("/preview", (req, res) => {
  void handleCv(req, res, "inline");
});

// Téléchargement du PDF
cvRouter.get("/download", (req, res) => {
  void handleCv(req, res, "attachment");
});
