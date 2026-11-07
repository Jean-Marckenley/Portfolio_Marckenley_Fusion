import { useEffect, useState } from "react";
import ContentManager from "./ContentManager";
import SkillsManager from "./SkillsManager";
import ExperiencesManager from "./ExperiencesManager";
import CVManager from "./CVManager";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type Project = {
    id: number;
    title: string;
    description: string;
    technologies: string[];
    repo_url: string | null;
    demo_url: string | null;
    image_url: string | null;
    sort_order: number;
};

type ProjectForm = {
    title: string;
    description: string;
    technologies: string;
    repo_url: string;
    demo_url: string;
    image_url: string;
    sort_order: number;
};

const emptyForm: ProjectForm = {
    title: "",
    description: "",
    technologies: "",
    repo_url: "",
    demo_url: "",
    image_url: "",
    sort_order: 0
};

function getToken() {
    return sessionStorage.getItem("adminToken");
}

async function apiRequest(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");

    const token = getToken();

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API}${path}`, {
        ...options,
        headers
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Erreur du serveur");
    }

    return data;
}

export default function Admin() {
    const [authenticated, setAuthenticated] = useState(false);
    const [checking, setChecking] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [projects, setProjects] = useState<Project[]>([]);
    const [form, setForm] = useState<ProjectForm>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);

    async function loadProjects() {
        const data = await apiRequest("/api/projects");
        setProjects(data);
    }

    useEffect(() => {
        let active = true;

        async function checkSession() {
            if (!getToken()) {
                if (active) setChecking(false);
                return;
            }

            try {
                await apiRequest("/api/auth/me");

                if (active) {
                    setAuthenticated(true);
                    await loadProjects();
                }
            } catch {
                sessionStorage.removeItem("adminToken");
                if (active) setAuthenticated(false);
            } finally {
                if (active) setChecking(false);
            }
        }

        void checkSession();

        return () => {
            active = false;
        };
    }, []);

    async function login(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy(true);
        setMessage("");

        try {
            const data = await apiRequest("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });

            sessionStorage.setItem("adminToken", data.token);

            // Vérifier les droits ADMIN avant d'ouvrir le tableau de bord.
            await apiRequest("/api/auth/me");

            setAuthenticated(true);
            setPassword("");
            await loadProjects();

            window.history.replaceState(null, "", "/admin");
        } catch (error) {
            sessionStorage.removeItem("adminToken");
            setAuthenticated(false);
            setMessage(
                error instanceof Error ? error.message : "Connexion impossible"
            );
        } finally {
            setBusy(false);
        }
    }

    function logout() {
        sessionStorage.removeItem("adminToken");
        setAuthenticated(false);
        setProjects([]);
        setForm(emptyForm);
        setEditingId(null);
        setMessage("");
        window.history.replaceState(null, "", "/admin/login");
    }

    function editProject(project: Project) {
        setEditingId(project.id);
        setForm({
            title: project.title,
            description: project.description ?? "",
            technologies: project.technologies?.join(", ") ?? "",
            repo_url: project.repo_url ?? "",
            demo_url: project.demo_url ?? "",
            image_url: project.image_url ?? "",
            sort_order: project.sort_order
        });

        setMessage("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function resetForm() {
        setForm(emptyForm);
        setEditingId(null);
    }

    async function saveProject(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy(true);
        setMessage("");

        const payload = {
            title: form.title.trim(),
            description: form.description.trim(),
            technologies: form.technologies
                .split(",")
                .map(value => value.trim())
                .filter(Boolean),
            repo_url: form.repo_url.trim() || null,
            demo_url: form.demo_url.trim() || null,
            image_url: form.image_url.trim() || null,
            sort_order: Number(form.sort_order)
        };

        try {
            await apiRequest(
                editingId === null
                    ? "/api/projects"
                    : `/api/projects/${editingId}`,
                {
                    method: editingId === null ? "POST" : "PUT",
                    body: JSON.stringify(payload)
                }
            );

            await loadProjects();
            resetForm();
            setMessage("Projet enregistré avec succès !");
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Erreur d'enregistrement"
            );
        } finally {
            setBusy(false);
        }
    }

    async function deleteProject(project: Project) {
        const confirmed = window.confirm(
            `Supprimer définitivement le projet "${project.title}" ?`
        );

        if (!confirmed) return;

        setMessage("");

        try {
            await apiRequest(`/api/projects/${project.id}`, {
                method: "DELETE"
            });

            await loadProjects();

            if (editingId === project.id) resetForm();

            setMessage("Projet supprimé avec succès.");
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Suppression impossible"
            );
        }
    }

    function updateField<K extends keyof ProjectForm>(
        key: K,
        value: ProjectForm[K]
    ) {
        setForm(previous => ({ ...previous, [key]: value }));
    }

    if (checking) {
        return <main className="admin-page">Vérification de la session…</main>;
    }

    if (!authenticated) {
        return (
            <main className="admin-page">
                <div className="admin-login">
                    <a href="/" className="back">← Retour au portfolio</a>
                    <p className="eyebrow">ESPACE PRIVÉ</p>
                    <h1>Connexion administrateur</h1>
                    <p>Connecte-toi pour gérer ton portfolio.</p>

                    <form onSubmit={login} className="admin-form">
                        <label>
                            Adresse courriel
                            <input
                                type="email"
                                required
                                autoComplete="username"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </label>

                        <label>
                            Mot de passe
                            <input
                                type="password"
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </label>

                        <button className="primary" disabled={busy}>
                            {busy ? "Connexion…" : "Se connecter"}
                        </button>
                    </form>

                    {message && <p role="alert" className="admin-message">{message}</p>}
                </div>
            </main>
        );
    }

    return (
        <main className="admin-page">
            <div className="admin-container">
                <header className="admin-header">
                    <div>
                        <p className="eyebrow">ESPACE ADMINISTRATEUR</p>
                        <h1>Mon tableau de bord</h1>
                        <p>Bienvenue dans la gestion de ton portfolio.</p>
                    </div>
                    <div className="admin-actions">
                        <a href="/" className="secondary">Voir le site</a>
                        <button className="secondary" onClick={logout}>
                            Déconnexion
                        </button>
                    </div>
                </header>

                <div className="admin-stat">
                    <span>Projets enregistrés</span>
                    <strong>{projects.length}</strong>
                </div>

                <section className="admin-panel">
                    <h2>{editingId === null ? "Ajouter un projet" : "Modifier le projet"}</h2>

                    <form className="admin-form" onSubmit={saveProject}>
                        <label>
                            Titre du projet
                            <input
                                required
                                maxLength={150}
                                value={form.title}
                                onChange={e => updateField("title", e.target.value)}
                            />
                        </label>

                        <label>
                            Description
                            <textarea
                                rows={4}
                                value={form.description}
                                onChange={e => updateField("description", e.target.value)}
                            />
                        </label>

                        <label>
                            Technologies (séparées par des virgules)
                            <input
                                placeholder="React, Spring Boot, PostgreSQL"
                                value={form.technologies}
                                onChange={e => updateField("technologies", e.target.value)}
                            />
                        </label>

                        <label>
                            Lien GitHub
                            <input
                                type="url"
                                value={form.repo_url}
                                onChange={e => updateField("repo_url", e.target.value)}
                            />
                        </label>

                        <label>
                            Lien de démonstration
                            <input
                                type="url"
                                value={form.demo_url}
                                onChange={e => updateField("demo_url", e.target.value)}
                            />
                        </label>

                        <label>
                            URL de l'image
                            <input
                                value={form.image_url}
                                onChange={e => updateField("image_url", e.target.value)}
                            />
                        </label>

                        <label>
                            Ordre d'affichage
                            <input
                                type="number"
                                value={form.sort_order}
                                onChange={e => updateField(
                                    "sort_order", Number(e.target.value)
                                )}
                            />
                        </label>

                        <div className="admin-actions">
                            <button className="primary" disabled={busy}>
                                {busy ? "Enregistrement…" : editingId === null
                                    ? "Ajouter le projet"
                                    : "Enregistrer les modifications"}
                            </button>

                            {editingId !== null && (
                                <button type="button" className="secondary" onClick={resetForm}>
                                    Annuler
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                {message && <p role="status" className="admin-message">{message}</p>}

                <section className="admin-panel">
                    <h2>Mes projets</h2>

                    {projects.length === 0 ? (
                        <p>Aucun projet enregistré.</p>
                    ) : (
                        <div className="admin-projects">
                            {projects.map(project => (
                                <article key={project.id} className="admin-project">
                                    <div>
                                        <h3>{project.title}</h3>
                                        <p>{project.description}</p>
                                        <small>{project.technologies?.join(" · ")}</small>
                                    </div>

                                    <div className="admin-actions">
                                        <button
                                            className="secondary"
                                            onClick={() => editProject(project)}
                                        >
                                            Modifier
                                        </button>
                                        <button
                                            className="admin-delete"
                                            onClick={() => deleteProject(project)}
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {/* FORMATION, CONTACT ET MESSAGES */}
                <ContentManager />

                {/* GESTION DES COMPÉTENCES */}
                <SkillsManager />

                {/* GESTION DES EXPÉRIENCES PROFESSIONNELLES */}
                <ExperiencesManager />
                <CVManager />
            </div>
        </main>
    );
}
