
import { useEffect, useState, type FormEvent } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type Experience = {
    id: number;
    position: string;
    company: string;
    start_date: string;
    end_date: string | null;
    description: string | null;
    sort_order: number;
};

type ExperienceForm = {
    position: string;
    company: string;
    start_date: string;
    end_date: string;
    description: string;
    sort_order: number;
};

const emptyForm: ExperienceForm = {
    position: "",
    company: "",
    start_date: "",
    end_date: "",
    description: "",
    sort_order: 0
};

// Convertit une date PostgreSQL en YYYY-MM-DD
function formatInputDate(value: string | null): string {
    return value ? value.slice(0, 10) : "";
}

function formatDisplayDate(value: string | null): string {
    if (!value) return "Aujourd'hui";

    const date = value.slice(0, 10);
    const [year, month] = date.split("-");

    return `${month}/${year}`;
}

// Communication avec le backend
async function api(
    path: string,
    method = "GET",
    payload?: unknown
): Promise<any> {
    const token = sessionStorage.getItem("adminToken");

    const response = await fetch(
        `${API}/api/admin/experiences${path}`,
        {
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
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Erreur du serveur");
    }

    return data;
}

export default function ExperiencesManager() {
    const [experiences, setExperiences] = useState<Experience[]>([]);
    const [form, setForm] = useState<ExperienceForm>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");

    async function loadExperiences() {
        const data = await api("/");
        setExperiences(data);
    }

    useEffect(() => {
        void loadExperiences().catch(error => {
            setMessage(
                error instanceof Error ? error.message : "Erreur"
            );
        });
    }, []);

    async function saveExperience(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (
            form.end_date &&
            form.end_date < form.start_date
        ) {
            setMessage(
                "La date de fin doit être postérieure à la date de début."
            );
            return;
        }

        setBusy(true);
        setMessage("");

        const payload = {
            position: form.position.trim(),
            company: form.company.trim(),
            start_date: form.start_date,
            end_date: form.end_date || null,
            description: form.description.trim() || null,
            sort_order: Number(form.sort_order)
        };

        try {
            await api(
                editingId === null ? "/" : `/${editingId}`,
                editingId === null ? "POST" : "PUT",
                payload
            );

            await loadExperiences();

            setForm(emptyForm);
            setEditingId(null);
            setMessage("Expérience enregistrée avec succès !");
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Erreur"
            );
        } finally {
            setBusy(false);
        }
    }

    function editExperience(experience: Experience) {
        setEditingId(experience.id);

        setForm({
            position: experience.position,
            company: experience.company,
            start_date: formatInputDate(experience.start_date),
            end_date: formatInputDate(experience.end_date),
            description: experience.description ?? "",
            sort_order: experience.sort_order
        });

        document.getElementById("admin-experiences")?.scrollIntoView({
            behavior: "smooth"
        });
    }

    async function deleteExperience(experience: Experience) {
        if (
            !window.confirm(
                `Supprimer l'expérience « ${experience.position} » chez ${experience.company} ?`
            )
        ) {
            return;
        }

        setBusy(true);
        setMessage("");

        try {
            await api(`/${experience.id}`, "DELETE");

            await loadExperiences();

            if (editingId === experience.id) {
                setEditingId(null);
                setForm(emptyForm);
            }

            setMessage("Expérience supprimée.");
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Erreur"
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <section
            className="admin-panel"
            id="admin-experiences"
        >
            <h2>
                {editingId === null
                    ? "Ajouter une expérience professionnelle"
                    : "Modifier une expérience professionnelle"}
            </h2>

            <form
                className="admin-form"
                onSubmit={saveExperience}
            >
                <label>
                    Poste occupé
                    <input
                        required
                        maxLength={150}
                        placeholder="Développeur web, stagiaire informatique..."
                        value={form.position}
                        onChange={e =>
                            setForm(previous => ({
                                ...previous,
                                position: e.target.value
                            }))
                        }
                    />
                </label>

                <label>
                    Entreprise
                    <input
                        required
                        maxLength={150}
                        placeholder="Nom de l'entreprise"
                        value={form.company}
                        onChange={e =>
                            setForm(previous => ({
                                ...previous,
                                company: e.target.value
                            }))
                        }
                    />
                </label>

                <label>
                    Date de début
                    <input
                        type="date"
                        required
                        value={form.start_date}
                        onChange={e =>
                            setForm(previous => ({
                                ...previous,
                                start_date: e.target.value
                            }))
                        }
                    />
                </label>

                <label>
                    Date de fin (facultative)
                    <input
                        type="date"
                        min={form.start_date || undefined}
                        value={form.end_date}
                        onChange={e =>
                            setForm(previous => ({
                                ...previous,
                                end_date: e.target.value
                            }))
                        }
                    />
                </label>

                <p>
                    Laisse la date de fin vide si tu occupes
                    toujours ce poste.
                </p>

                <label>
                    Description et réalisations
                    <textarea
                        rows={5}
                        placeholder="Décris tes responsabilités, tes tâches et tes réalisations..."
                        value={form.description}
                        onChange={e =>
                            setForm(previous => ({
                                ...previous,
                                description: e.target.value
                            }))
                        }
                    />
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
                            : "Enregistrer l'expérience"}
                    </button>

                    {editingId !== null && (
                        <button
                            type="button"
                            className="secondary"
                            disabled={busy}
                            onClick={() => {
                                setEditingId(null);
                                setForm(emptyForm);
                                setMessage("");
                            }}
                        >
                            Annuler
                        </button>
                    )}
                </div>
            </form>

            {message && (
                <p
                    role="status"
                    className="admin-message"
                >
                    {message}
                </p>
            )}

            <h2 style={{ marginTop: 28 }}>
                Mes expériences ({experiences.length})
            </h2>

            {experiences.length === 0 ? (
                <p>Aucune expérience enregistrée.</p>
            ) : (
                experiences.map(experience => (
                    <article
                        className="admin-project"
                        key={experience.id}
                    >
                        <div>
                            <h3>{experience.position}</h3>

                            <p>
                                <strong>{experience.company}</strong>
                            </p>

                            <p>
                                {formatDisplayDate(experience.start_date)}
                                {" — "}
                                {formatDisplayDate(experience.end_date)}
                            </p>

                            {experience.description && (
                                <p style={{ whiteSpace: "pre-line" }}>
                                    {experience.description}
                                </p>
                            )}

                            <p>
                                Ordre : {experience.sort_order}
                            </p>
                        </div>

                        <div className="admin-actions">
                            <button
                                type="button"
                                className="secondary"
                                disabled={busy}
                                onClick={() =>
                                    editExperience(experience)
                                }
                            >
                                Modifier
                            </button>

                            <button
                                type="button"
                                className="admin-delete"
                                disabled={busy}
                                onClick={() =>
                                    void deleteExperience(experience)
                                }
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
