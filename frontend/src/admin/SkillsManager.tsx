
import { useEffect, useState, type FormEvent } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type Skill = {
    id: number;
    name: string;
    category: string | null;
    level: number | null;
    sort_order: number;
};

type SkillForm = {
    name: string;
    category: string;
    level: string;
    sort_order: number;
};

const emptyForm: SkillForm = {
    name: "",
    category: "",
    level: "",
    sort_order: 0
};

async function api(
    path: string,
    method = "GET",
    payload?: unknown
): Promise<any> {
    const token = sessionStorage.getItem("adminToken");

    const response = await fetch(`${API}/api/admin/skills${path}`, {
        method,
        headers: {
            ...(payload !== undefined
                ? { "Content-Type": "application/json" }
                : {}),
            Authorization: `Bearer ${token ?? ""}`
        },
        ...(payload !== undefined
            ? { body: JSON.stringify(payload) }
            : {})
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Erreur du serveur");
    }

    return data;
}

export default function SkillsManager() {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [form, setForm] = useState<SkillForm>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");

    async function loadSkills() {
        const data = await api("/");
        setSkills(data);
    }

    useEffect(() => {
        void loadSkills().catch(error => {
            setMessage(error.message);
        });
    }, []);

    async function saveSkill(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy(true);
        setMessage("");

        const payload = {
            name: form.name.trim(),
            category: form.category.trim() || null,
            level: form.level ? Number(form.level) : null,
            sort_order: Number(form.sort_order)
        };

        try {
            await api(
                editingId === null ? "/" : `/${editingId}`,
                editingId === null ? "POST" : "PUT",
                payload
            );

            await loadSkills();

            setForm(emptyForm);
            setEditingId(null);
            setMessage("Compétence enregistrée avec succès !");
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Erreur"
            );
        } finally {
            setBusy(false);
        }
    }

    function editSkill(skill: Skill) {
        setEditingId(skill.id);

        setForm({
            name: skill.name,
            category: skill.category ?? "",
            level: skill.level?.toString() ?? "",
            sort_order: skill.sort_order
        });

        document.getElementById("admin-skills")?.scrollIntoView({
            behavior: "smooth"
        });
    }

    async function deleteSkill(skill: Skill) {
        if (!window.confirm(`Supprimer « ${skill.name} » ?`)) {
            return;
        }

        try {
            await api(`/${skill.id}`, "DELETE");
            await loadSkills();

            if (editingId === skill.id) {
                setEditingId(null);
                setForm(emptyForm);
            }

            setMessage("Compétence supprimée.");
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Erreur"
            );
        }
    }

    return (
        <section className="admin-panel" id="admin-skills">
            <h2>
                {editingId === null
                    ? "Ajouter une compétence"
                    : "Modifier une compétence"}
            </h2>

            <form className="admin-form" onSubmit={saveSkill}>
                <label>
                    Nom de la compétence
                    <input
                        required
                        maxLength={100}
                        placeholder="React, Java, PostgreSQL..."
                        value={form.name}
                        onChange={e =>
                            setForm(previous => ({
                                ...previous,
                                name: e.target.value
                            }))
                        }
                    />
                </label>

                <label>
                    Catégorie
                    <input
                        maxLength={50}
                        placeholder="Frontend, Backend, Base de données..."
                        value={form.category}
                        onChange={e =>
                            setForm(previous => ({
                                ...previous,
                                category: e.target.value
                            }))
                        }
                    />
                </label>

                <label>
                    Niveau
                    <select
                        value={form.level}
                        onChange={e =>
                            setForm(previous => ({
                                ...previous,
                                level: e.target.value
                            }))
                        }
                    >
                        <option value="">Non précisé</option>
                        {[1, 2, 3, 4, 5].map(level => (
                            <option key={level} value={level}>
                                {level}/5
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Ordre d'affichage
                    <input
                        type="number"
                        value={form.sort_order}
                        onChange={e =>
                            setForm(previous => ({
                                ...previous,
                                sort_order: Number(e.target.value)
                            }))
                        }
                    />
                </label>

                <div className="admin-actions">
                    <button
                        type="submit"
                        className="primary"
                        disabled={busy}
                    >
                        {busy
                            ? "Enregistrement..."
                            : "Enregistrer la compétence"}
                    </button>

                    {editingId !== null && (
                        <button
                            type="button"
                            className="secondary"
                            onClick={() => {
                                setEditingId(null);
                                setForm(emptyForm);
                            }}
                        >
                            Annuler
                        </button>
                    )}
                </div>
            </form>

            {message && (
                <p role="status" className="admin-message">
                    {message}
                </p>
            )}

            <h2 style={{ marginTop: 28 }}>
                Mes compétences ({skills.length})
            </h2>

            {skills.length === 0 ? (
                <p>Aucune compétence enregistrée.</p>
            ) : (
                skills.map(skill => (
                    <article className="admin-project" key={skill.id}>
                        <div>
                            <h3>{skill.name}</h3>
                            <p>
                                {skill.category || "Sans catégorie"}
                                {skill.level
                                    ? ` · Niveau ${skill.level}/5`
                                    : ""}
                            </p>
                        </div>

                        <div className="admin-actions">
                            <button
                                type="button"
                                className="secondary"
                                onClick={() => editSkill(skill)}
                            >
                                Modifier
                            </button>

                            <button
                                type="button"
                                className="admin-delete"
                                onClick={() => void deleteSkill(skill)}
                            >
                                Supprimer
                            </button>
                        </div>
                    </article>
                ))
            )}
        </section>
    );
}
