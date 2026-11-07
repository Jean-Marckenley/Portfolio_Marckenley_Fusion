
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type Template = "classic" | "modern";

type CvSection =
    | "profile"
    | "experiences"
    | "education"
    | "skills"
    | "projects";

const sectionOptions: {
    id: CvSection;
    label: string;
}[] = [
    { id: "profile", label: "Profil professionnel" },
    { id: "experiences", label: "Expériences professionnelles" },
    { id: "education", label: "Formations" },
    { id: "skills", label: "Compétences" },
    { id: "projects", label: "Projets" }
];

export default function CVManager() {
    const [template, setTemplate] = useState<Template>("classic");

    const [sections, setSections] = useState<CvSection[]>(
        sectionOptions.map(section => section.id)
    );

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");

    // Libérer les anciennes URL PDF
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    function toggleSection(section: CvSection) {
        setSections(previous =>
            previous.includes(section)
                ? previous.filter(item => item !== section)
                : [...previous, section]
        );

        setPreviewUrl(null);
    }

    function buildPath(action: "preview" | "download") {
        const params = new URLSearchParams({
            template,
            sections: sections.join(",")
        });

        return `${API}/api/cv/${action}?${params.toString()}`;
    }

    async function requestPdf(
        action: "preview" | "download"
    ): Promise<{
        blob: Blob;
        filename: string;
    }> {
        const token = sessionStorage.getItem("adminToken");

        if (!token) {
            throw new Error("Connecte-toi à ton administration.");
        }

        const response = await fetch(buildPath(action), {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const data = await response.json().catch(() => null);

            throw new Error(
                data?.error || "Impossible de générer le CV."
            );
        }

        const blob = await response.blob();

        const disposition =
            response.headers.get("Content-Disposition") ?? "";

        const match = disposition.match(/filename="([^"]+)"/);

        return {
            blob,
            filename: match?.[1] ?? "CV_Portfolio.pdf"
        };
    }

    async function previewCv() {
        if (sections.length === 0) {
            setMessage("Sélectionne au moins une section.");
            return;
        }

        setBusy(true);
        setMessage("");

        try {
            const { blob } = await requestPdf("preview");
            const url = URL.createObjectURL(blob);

            setPreviewUrl(url);
            setMessage("Aperçu du CV généré avec succès !");
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Erreur de génération."
            );
        } finally {
            setBusy(false);
        }
    }

    async function downloadCv() {
        if (sections.length === 0) {
            setMessage("Sélectionne au moins une section.");
            return;
        }

        setBusy(true);
        setMessage("");

        try {
            const { blob, filename } =
                await requestPdf("download");

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);

            setMessage("Téléchargement du CV lancé !");
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Erreur de téléchargement."
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="admin-panel" id="admin-cv">
            <h2>Générateur de CV professionnel</h2>

            <p>
                Personnalise ton CV à partir des informations
                enregistrées dans ton portfolio.
            </p>

            <div className="admin-form">
                <label>
                    Modèle du CV
                    <select
                        value={template}
                        onChange={event => {
                            setTemplate(event.target.value as Template);
                            setPreviewUrl(null);
                        }}
                    >
                        <option value="classic">
                            Classique
                        </option>

                        <option value="modern">
                            Moderne
                        </option>
                    </select>
                </label>

                <fieldset>
                    <legend>
                        Sections à inclure dans le CV
                    </legend>

                    {sectionOptions.map(section => (
                        <label
                            key={section.id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                marginTop: 12
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={sections.includes(section.id)}
                                onChange={() =>
                                    toggleSection(section.id)
                                }
                                style={{ width: "auto" }}
                            />

                            {section.label}
                        </label>
                    ))}
                </fieldset>

                <div className="admin-actions">
                    <button
                        type="button"
                        className="primary"
                        disabled={busy || sections.length === 0}
                        onClick={() => void previewCv()}
                    >
                        {busy
                            ? "Génération..."
                            : "Aperçu du CV"}
                    </button>

                    <button
                        type="button"
                        className="secondary"
                        disabled={busy || sections.length === 0}
                        onClick={() => void downloadCv()}
                    >
                        Télécharger mon CV (PDF)
                    </button>
                </div>
            </div>

            {message && (
                <p role="status" className="admin-message">
                    {message}
                </p>
            )}

            {previewUrl && (
                <div style={{ marginTop: 24 }}>
                    <h3>Aperçu du CV</h3>

                    <iframe
                        src={previewUrl}
                        title="Aperçu de mon CV"
                        style={{
                            width: "100%",
                            height: 650,
                            border: "1px solid #ccc",
                            borderRadius: 8
                        }}
                    />
                </div>
            )}
        </section>
    );
}
