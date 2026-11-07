import { useEffect, useState, type FormEvent } from "react";


const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const DEFAULT_SLUG = "marckenley";

type SectionProps = { slug?: string };

// ========================================
// TYPES
// ========================================

type Education = {
 id: number;
 degree: string;
 school: string;
 start_date: string;
 end_date: string | null;
 description: string | null;
};

type Contact = {
 contact_email: string | null;
 linkedin_url: string | null;
 github_url: string | null;
 website_url: string | null;
};

type Content = {
 contact: Contact;
 education: Education[];
};

type PublicSkill = {
 id: number;
 name: string;
 category: string | null;
 level: number | null;
};

type PublicExperience = {
 id: number;
 position: string;
 company: string;
 start_date: string;
 end_date: string | null;
 description: string | null;
 sort_order: number;
};

// ========================================
// CHARGEMENT DU CONTENU
// ========================================

export function usePortfolioContent(slug = DEFAULT_SLUG) {
 const [content, setContent] = useState<Content | null>(null);

 useEffect(() => {
  const controller = new AbortController();

  async function loadContent() {
   try {
    const response = await fetch(
        `${API}/api/content/${encodeURIComponent(slug)}`,
        { signal: controller.signal }
    );

    if (!response.ok) {
     throw new Error("Contenu indisponible");
    }

    const data: Content = await response.json();

    if (!controller.signal.aborted) {
     setContent(data);
    }
   } catch (error) {
    if (!controller.signal.aborted) {
     console.error(
         "Erreur de chargement du portfolio :",
         error
     );
    }
   }
  }

  void loadContent();

  return () => controller.abort();
 }, [slug]);

 return content;
}

// ========================================
// FORMATAGE DES DATES
// ========================================

type FormationProps = {
 slug?: string;
};

type Formation = {
 id: number;
 degree: string;
 school: string;
 start_date: string;
 end_date: string | null;
 description: string | null;
};

export function FormationSection({
                                  slug = "marckenley"
                                 }: FormationProps) {
 const [formations, setFormations] = useState<Formation[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 useEffect(() => {
  const controller = new AbortController();

  async function chargerFormations() {
   setLoading(true);
   setError("");

   try {
    const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api/content/${encodeURIComponent(slug)}`,
        { signal: controller.signal }
    );

    if (!response.ok) {
     throw new Error("Impossible de charger les formations.");
    }

    const data = await response.json();

    if (!controller.signal.aborted) {
     setFormations(
         Array.isArray(data.education) ? data.education : []
     );
    }
   } catch (err) {
    if (!controller.signal.aborted) {
     setError("Erreur de chargement des formations.");
    }
   } finally {
    if (!controller.signal.aborted) {
     setLoading(false);
    }
   }
  }

  void chargerFormations();

  return () => controller.abort();
 }, [slug]);

 return (
     <section id="education" className="section alt">
      <div className="wrap">
       <p className="eyebrow">MON PARCOURS</p>
       <h2>Formation</h2>

       {loading && <p>Chargement des formations...</p>}

       {error && <p role="alert">{error}</p>}

       {!loading && !error && formations.length === 0 && (
           <p>Mes formations seront bientôt disponibles.</p>
       )}

       {!loading && !error && formations.map(formation => (
           <div className="education" key={formation.id}>
            <div>
             <h3>{formation.degree}</h3>
             <p>{formation.school}</p>
             {formation.description && (
                 <p>{formation.description}</p>
             )}
            </div>

            <span>
              {formation.start_date.slice(0, 4)}
             {" – "}
             {formation.end_date
                 ? formation.end_date.slice(0, 4)
                 : "En cours"}
            </span>
           </div>
       ))}
      </div>
     </section>
 );
}



// ========================================
// TYPES DES COMPOSANTS PUBLICS
// ========================================

type PublicSectionProps = {
 slug?: string;
};

type PortfolioContact = {
 contact_email: string | null;
 linkedin_url: string | null;
 github_url: string | null;
 website_url: string | null;
};

type SkillItem = {
 id: number;
 name: string;
 category: string | null;
 level: number | null;
};

type ExperienceItem = {
 id: number;
 position: string;
 company: string;
 start_date: string;
 end_date: string | null;
 description: string | null;
 sort_order: number;
};

type ProjectItem = {
 id: number;
 title: string;
 description: string | null;
 technologies: string[];
 repo_url: string | null;
 demo_url: string | null;
 image_url: string | null;
 sort_order: number;
};

const PUBLIC_API =
    import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function formatPublicDate(value: string | null): string {
 if (!value) return "Aujourd'hui";

 const date = new Date(value);

 if (Number.isNaN(date.getTime())) {
  return value.slice(0, 10);
 }

 return new Intl.DateTimeFormat("fr-CA", {
  month: "long",
  year: "numeric",
  timeZone: "UTC"
 }).format(date);
}

// ========================================
// CONTACT
// ========================================

export function ContactSection({
                                slug = "marckenley"
                               }: PublicSectionProps) {
 const [contact, setContact] =
     useState<PortfolioContact | null>(null);

 const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 const [subject, setSubject] = useState("");
 const [message, setMessage] = useState("");
 const [website, setWebsite] = useState("");
 const [status, setStatus] = useState("");
 const [busy, setBusy] = useState(false);

 useEffect(() => {
  const controller = new AbortController();

  async function loadContact() {
   try {
    const response = await fetch(
        `${PUBLIC_API}/api/content/${encodeURIComponent(slug)}`,
        { signal: controller.signal }
    );

    if (!response.ok) {
     throw new Error("Contact indisponible");
    }

    const data = await response.json();

    if (!controller.signal.aborted) {
     setContact(data.contact ?? null);
    }
   } catch (error) {
    if (!controller.signal.aborted) {
     console.error("Erreur chargement contact :", error);
    }
   }
  }

  void loadContact();

  return () => controller.abort();
 }, [slug]);

 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (busy) return;

  setBusy(true);
  setStatus("");

  try {
   const response = await fetch(
       `${PUBLIC_API}/api/content/${encodeURIComponent(slug)}/messages`,
       {
        method: "POST",
        headers: {
         "Content-Type": "application/json"
        },
        body: JSON.stringify({
         name,
         email,
         subject,
         message,
         website
        })
       }
   );

   if (!response.ok) {
    throw new Error(
        "Envoi impossible. Réessaie plus tard."
    );
   }

   setStatus("Message enregistré. Merci !");
   setName("");
   setEmail("");
   setSubject("");
   setMessage("");
   setWebsite("");
  } catch (error) {
   setStatus(
       error instanceof Error
           ? error.message
           : "Une erreur est survenue."
   );
  } finally {
   setBusy(false);
  }
 }

 return (
     <section id="contact" className="section contact">
      <div className="wrap">
       <p className="eyebrow">COLLABORONS</p>
       <h2>Un projet en tête ?</h2>

       <p>
        Échangeons sur une application, une idée
        ou une opportunité professionnelle.
       </p>

       <form
           className="admin-form"
           onSubmit={submit}
           style={{ maxWidth: 620 }}
       >
        <label>
         Nom
         <input
             value={name}
             onChange={e => setName(e.target.value)}
             required
             minLength={2}
             maxLength={150}
         />
        </label>

        <label>
         Adresse courriel
         <input
             type="email"
             value={email}
             onChange={e => setEmail(e.target.value)}
             required
         />
        </label>

        <label>
         Sujet
         <input
             value={subject}
             onChange={e => setSubject(e.target.value)}
             required
             minLength={2}
         />
        </label>

        <label>
         Message
         <textarea
             rows={5}
             value={message}
             onChange={e => setMessage(e.target.value)}
             required
             minLength={5}
         />
        </label>

        <label
            style={{ display: "none" }}
            aria-hidden="true"
        >
         Site web
         <input
             tabIndex={-1}
             autoComplete="off"
             value={website}
             onChange={e => setWebsite(e.target.value)}
         />
        </label>

        <button
            type="submit"
            className="primary"
            disabled={busy}
        >
         {busy ? "Envoi…" : "Envoyer le message"}
        </button>
       </form>

       {status && <p role="status">{status}</p>}

       <div
           className="actions"
           style={{ marginTop: 24 }}
       >
        {contact?.contact_email && (
            <a
                className="secondary"
                href={`mailto:${contact.contact_email}`}
            >
             Écrire un courriel
            </a>
        )}

        {contact?.github_url && (
            <a
                className="secondary"
                href={contact.github_url}
                target="_blank"
                rel="noopener noreferrer"
            >
             GitHub ↗
            </a>
        )}

        {contact?.linkedin_url && (
            <a
                className="secondary"
                href={contact.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
            >
             LinkedIn ↗
            </a>
        )}

        {contact?.website_url && (
            <a
                className="secondary"
                href={contact.website_url}
                target="_blank"
                rel="noopener noreferrer"
            >
             Site web ↗
            </a>
        )}
       </div>
      </div>
     </section>
 );
}

// ========================================
// COMPÉTENCES
// ========================================

export function SkillsSection({
                               slug = "marckenley"
                              }: PublicSectionProps) {
 const [skills, setSkills] = useState<SkillItem[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 useEffect(() => {
  const controller = new AbortController();

  async function loadSkills() {
   setLoading(true);
   setError("");

   try {
    const response = await fetch(
        `${PUBLIC_API}/api/public/skills/${encodeURIComponent(slug)}`,
        { signal: controller.signal }
    );

    if (!response.ok) {
     throw new Error(
         "Impossible de charger les compétences."
     );
    }

    const data: SkillItem[] = await response.json();

    if (!controller.signal.aborted) {
     setSkills(data);
    }
   } catch (error) {
    if (!controller.signal.aborted) {
     setError(
         error instanceof Error
             ? error.message
             : "Erreur de chargement."
     );
    }
   } finally {
    if (!controller.signal.aborted) {
     setLoading(false);
    }
   }
  }

  void loadSkills();

  return () => controller.abort();
 }, [slug]);

 return (
     <section id="skills" className="section alt">
      <div className="wrap">
       <p className="eyebrow">MON SAVOIR-FAIRE</p>
       <h2>Compétences techniques</h2>

       {loading && (
           <p>Chargement des compétences...</p>
       )}

       {error && <p role="alert">{error}</p>}

       {!loading && !error && skills.length === 0 && (
           <p>
            Aucune compétence enregistrée
            pour le moment.
           </p>
       )}

       <div className="skill-grid">
        {skills.map(skill => (
            <div className="skill" key={skill.id}>
             <span className="skill-dot" />
             {skill.name}
            </div>
        ))}
       </div>
      </div>
     </section>
 );
}

// ========================================
// EXPÉRIENCES PROFESSIONNELLES
// ========================================

export function ExperiencesSection({
                                    slug = "marckenley"
                                   }: PublicSectionProps) {
 const [experiences, setExperiences] =
     useState<ExperienceItem[]>([]);

 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 useEffect(() => {
  const controller = new AbortController();

  async function loadExperiences() {
   setLoading(true);
   setError("");

   try {
    const response = await fetch(
        `${PUBLIC_API}/api/public/experiences/${encodeURIComponent(slug)}`,
        { signal: controller.signal }
    );

    if (!response.ok) {
     throw new Error(
         "Impossible de charger les expériences."
     );
    }

    const data: ExperienceItem[] =
        await response.json();

    if (!controller.signal.aborted) {
     setExperiences(data);
    }
   } catch (error) {
    if (!controller.signal.aborted) {
     setError(
         error instanceof Error
             ? error.message
             : "Erreur de chargement."
     );
    }
   } finally {
    if (!controller.signal.aborted) {
     setLoading(false);
    }
   }
  }

  void loadExperiences();

  return () => controller.abort();
 }, [slug]);

 return (
     <section id="experiences" className="section">
      <div className="wrap">
       <p className="eyebrow">
        MON PARCOURS PROFESSIONNEL
       </p>

       <h2>Expériences professionnelles</h2>

       {loading && (
           <p>Chargement des expériences...</p>
       )}

       {error && <p role="alert">{error}</p>}

       {!loading && !error && experiences.length === 0 && (
           <p>
            Mes expériences professionnelles
            seront bientôt disponibles.
           </p>
       )}

       {!loading && !error &&
           experiences.map(experience => (
               <article
                   key={experience.id}
                   className="education"
               >
                <div>
                 <h3>{experience.position}</h3>
                 <p>
                  <strong>{experience.company}</strong>
                 </p>

                 {experience.description && (
                     <p style={{ whiteSpace: "pre-line" }}>
                      {experience.description}
                     </p>
                 )}
                </div>

                <span>
                {formatPublicDate(experience.start_date)}
                 {" – "}
                 {formatPublicDate(experience.end_date)}
              </span>
               </article>
           ))}
      </div>
     </section>
 );
}

// ========================================
// PROJETS PUBLICS
// ========================================

export function PublicProjectsSection({
                                       slug = "marckenley"
                                      }: PublicSectionProps) {
 const [projects, setProjects] =
     useState<ProjectItem[]>([]);

 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 useEffect(() => {
  const controller = new AbortController();

  async function loadProjects() {
   setLoading(true);
   setError("");

   try {
    const response = await fetch(
        `${PUBLIC_API}/api/public/projects/${encodeURIComponent(slug)}`,
        { signal: controller.signal }
    );

    if (!response.ok) {
     throw new Error(
         "Impossible de charger les projets."
     );
    }

    const data: ProjectItem[] =
        await response.json();

    if (!controller.signal.aborted) {
     setProjects(data);
    }
   } catch (error) {
    if (!controller.signal.aborted) {
     setError(
         error instanceof Error
             ? error.message
             : "Erreur de chargement."
     );
    }
   } finally {
    if (!controller.signal.aborted) {
     setLoading(false);
    }
   }
  }

  void loadProjects();

  return () => controller.abort();
 }, [slug]);

 return (
     <section id="projects" className="section">
      <div className="wrap">
       <p className="eyebrow">RÉALISATIONS</p>
       <h2>Projets sélectionnés</h2>

       {loading && (
           <p>Chargement des projets...</p>
       )}

       {error && <p role="alert">{error}</p>}

       {!loading && !error && projects.length === 0 && (
           <p>
            Aucun projet disponible pour le moment.
           </p>
       )}

       <div className="project-grid">
        {projects.map((project, index) => (
            <article
                className="project"
                key={project.id}
            >
             <div className="project-photo">
              {project.image_url ? (
                  <img
                      src={
                       project.image_url.startsWith("http")
                           ? project.image_url
                           : `${window.location.origin}${project.image_url}`
                      }
                      alt={`Illustration du projet ${project.title}`}
                      loading="lazy"
                      onError={(event) => {
                       console.error(
                           "Image introuvable :",
                           event.currentTarget.src
                       );
                      }}
                  />
              ) : (
                  <div
                      style={{
                       width: "100%",
                       minHeight: 220,
                       display: "grid",
                       placeItems: "center",
                       background: "#e8edf3",
                       color: "#263449",
                       padding: 20,
                       fontSize: 24,
                       fontWeight: 700
                      }}
                  >
                   {project.title}
                  </div>
              )}

              <span className="project-num">
                  {String(index + 1).padStart(2, "0")}
                </span>
             </div>

             <div className="project-body">
              <h3>{project.title}</h3>

              {project.description && (
                  <p>{project.description}</p>
              )}

              <div className="tags">
               {(project.technologies ?? []).map(
                   technology => (
                       <span key={technology}>
                        {technology}
                      </span>
                   )
               )}
              </div>

              {(project.repo_url || project.demo_url) && (
                  <div
                      className="actions"
                      style={{ marginTop: 16 }}
                  >
                   {project.repo_url && (
                       <a
                           className="secondary"
                           href={project.repo_url}
                           target="_blank"
                           rel="noopener noreferrer"
                       >
                        GitHub ↗
                       </a>
                   )}

                   {project.demo_url && (
                       <a
                           className="secondary"
                           href={project.demo_url}
                           target="_blank"
                           rel="noopener noreferrer"
                       >
                        Démonstration ↗
                       </a>
                   )}
                  </div>
              )}
             </div>
            </article>
        ))}
       </div>
      </div>
     </section>
 );
}
