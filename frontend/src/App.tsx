
import { useEffect, useState } from "react";
import { portfolio } from "./portfolio";
import Admin from "./admin/Admin";
import "./style.css";

import {
  FormationSection,
  ContactSection,
  SkillsSection,
  ExperiencesSection,
  PublicProjectsSection
} from "./components/PublicSections";

// ========================================
// CONFIGURATION API
// ========================================

const API = import.meta.env.PROD
    ? ""
    : (import.meta.env.VITE_API_URL ?? "http://localhost:3000");

const SLUG = "marckenley";

// ========================================
// TYPES
// ========================================

type PublicProfile = {
  full_name: string;
  headline?: string | null;
  bio?: string | null;
  slug: string;
};

// ========================================
// BARRE DE NAVIGATION
// ========================================

function Nav() {
  const [open, setOpen] = useState(false);

  const links = [
    { name: "À propos", id: "about" },
    { name: "Compétences", id: "skills" },
    { name: "Expériences", id: "experiences" },
    { name: "Projets", id: "projects" },
    { name: "Formation", id: "education" },
    { name: "Contact", id: "contact" }
  ];

  return (
      <header className="nav">
        <a className="brand" href="/#home">
          MC<span>.</span>
        </a>

        <button
            className="menu"
            type="button"
            aria-label="Afficher le menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
        >
          ☰
        </button>

        <nav
            className={open ? "navlinks visible" : "navlinks"}
            aria-label="Navigation principale"
        >
          {links.map(link => (
              <a
                  key={link.id}
                  href={`/#${link.id}`}
                  onClick={() => setOpen(false)}
              >
                {link.name}
              </a>
          ))}
        </nav>
      </header>
  );
}

// ========================================
// PAGE D'ACCUEIL DU PORTFOLIO
// ========================================

function Home() {
  return (
      <>
        <Nav />

        <main>

          {/* ========================================
            ACCUEIL
        ======================================== */}

          <section id="home" className="hero">
            <div className="hero-overlay" />

            <div className="hero-content">
              <p className="eyebrow">
                PORTFOLIO PROFESSIONNEL
              </p>

              <h1>
                Bonjour, je suis
                <br />
                <span>{portfolio.name}</span>
              </h1>

              <p className="role">
                {portfolio.role}
              </p>

              <p className="lede">
                {portfolio.intro}
              </p>

              <div className="actions">
                <a
                    className="primary"
                    href="#projects"
                >
                  Découvrir mes projets{" "}
                  <span aria-hidden="true">↗</span>
                </a>

                <a
                    className="secondary"
                    href={`${API}/api/public/${SLUG}/cv`}
                >
                  Télécharger mon CV (PDF) ↓
                </a>

                <a
                    className="secondary"
                    href="#contact"
                >
                  Me contacter
                </a>
              </div>
            </div>

            <a
                href="#about"
                className="scroll-down"
            >
              Découvrir ↓
            </a>
          </section>

          {/* ========================================
            À PROPOS
        ======================================== */}

          <section id="about" className="section">
            <div className="wrap">
              <p className="eyebrow">
                QUI SUIS-JE ?
              </p>

              <h2>À propos de moi</h2>

              <div className="about-card">
                <div>
                <span className="large-asterisk">
                  ✳
                </span>

                  <h3>
                    Construire des solutions
                    qui ont du sens.
                  </h3>
                </div>

                <p>{portfolio.about}</p>
              </div>
            </div>
          </section>

          {/* ========================================
            COMPÉTENCES
        ======================================== */}

          <SkillsSection slug={SLUG} />

          {/* ========================================
            EXPÉRIENCES PROFESSIONNELLES
        ======================================== */}

          <ExperiencesSection slug={SLUG} />

          {/* ========================================
            PROJETS
        ======================================== */}

          <PublicProjectsSection slug={SLUG} />

          {/* ========================================
            FORMATION
        ======================================== */}

          <FormationSection slug={SLUG} />

          {/* ========================================
            CONTACT
        ======================================== */}

          <ContactSection slug={SLUG} />

        </main>

        {/* ========================================
          PIED DE PAGE
      ======================================== */}

        <footer>
          © {new Date().getFullYear()}{" "}
          {portfolio.name} ·
          Portfolio réalisé avec React,
          Vite et TypeScript.
        </footer>
      </>
  );
}

// ========================================
// PORTFOLIO PUBLIC DEPUIS POSTGRESQL
// ========================================

function PublicPortfolio() {
  // Récupérer le slug depuis l'adresse /p/:slug
  const slug =
      window.location.pathname
          .split("/")
          .filter(Boolean)[1] ?? "";

  const [profile, setProfile] =
      useState<PublicProfile | null>(null);

  const [status, setStatus] = useState(
      "Chargement du portfolio…"
  );

  // ========================================
  // CHARGER LE PROFIL PUBLIC
  // ========================================

  useEffect(() => {
    if (!slug) {
      setStatus(
          "Identifiant du portfolio manquant."
      );
      return;
    }

    const controller = new AbortController();

    async function loadProfile() {
      try {
        const response = await fetch(
            `${API}/api/public/${encodeURIComponent(slug)}`,
            { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(
              response.status === 404
                  ? "Portfolio introuvable ou privé."
                  : "API indisponible."
          );
        }

        const data: PublicProfile =
            await response.json();

        if (!controller.signal.aborted) {
          setProfile(data);
          setStatus("");
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setProfile(null);

        setStatus(
            error instanceof Error
                ? error.message
                : "Une erreur est survenue."
        );
      }
    }

    void loadProfile();

    return () => controller.abort();
  }, [slug]);

  // ========================================
  // AFFICHAGE DU PORTFOLIO PUBLIC
  // ========================================

  return (
      <>
        <Nav />

        <main className="public-page">

          <div className="wrap">
            <a href="/" className="back">
              ← Retour à l'accueil
            </a>

            {!profile && (
                <p role="status">
                  {status}
                </p>
            )}
          </div>

          {profile && (
              <>
                {/* ========================================
                PRÉSENTATION
            ======================================== */}

                <div className="wrap">
                  <article
                      className="public-card"
                      id="about"
                  >
                    <p className="eyebrow">
                      PORTFOLIO PUBLIC
                    </p>

                    <h1>
                      {profile.full_name}
                    </h1>

                    {profile.headline && (
                        <h2>
                          {profile.headline}
                        </h2>
                    )}

                    {profile.bio && (
                        <p>
                          {profile.bio}
                        </p>
                    )}

                    <div
                        className="actions"
                        style={{ marginTop: 24 }}
                    >
                      <a
                          className="primary"
                          href={`${API}/api/public/${encodeURIComponent(profile.slug)}/cv`}
                      >
                        Télécharger mon CV (PDF) ↓
                      </a>
                    </div>
                  </article>
                </div>

                {/* ========================================
                COMPÉTENCES
            ======================================== */}

                <SkillsSection
                    slug={profile.slug}
                />

                {/* ========================================
                EXPÉRIENCES PROFESSIONNELLES
            ======================================== */}

                <ExperiencesSection
                    slug={profile.slug}
                />

                {/* ========================================
                PROJETS
            ======================================== */}

                <PublicProjectsSection
                    slug={profile.slug}
                />

                {/* ========================================
                FORMATION
            ======================================== */}

                <FormationSection
                    slug={profile.slug}
                />

                {/* ========================================
                CONTACT
            ======================================== */}

                <ContactSection
                    slug={profile.slug}
                />
              </>
          )}
        </main>

        <footer>
          © {new Date().getFullYear()}{" "}
          {profile?.full_name ?? "Portfolio professionnel"}
        </footer>
      </>
  );
}

// ========================================
// GESTION DES PAGES
// ========================================

export default function App() {
  const path = window.location.pathname;

  // Administration
  if (
      path === "/admin" ||
      path === "/admin/login"
  ) {
    return <Admin />;
  }

  // Portfolio public dynamique
  if (path.startsWith("/p/")) {
    return <PublicPortfolio />;
  }

  // Page d'accueil principale
  return <Home />;
}
