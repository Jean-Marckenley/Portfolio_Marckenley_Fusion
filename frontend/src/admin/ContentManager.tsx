import { useEffect, useState, type FormEvent } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const emptyEducation = { degree: "", school: "", start_date: "", end_date: "", description: "", sort_order: 0 };
type EducationForm = typeof emptyEducation;
type Education = EducationForm & { id: number };
type Contact = { contact_email: string; linkedin_url: string; github_url: string; website_url: string };
type Message = { id: number; sender_name: string; sender_email: string; subject: string; message: string; created_at: string };

async function request(path: string, method = "GET", payload?: unknown) {
 const token = sessionStorage.getItem("adminToken");
 const response = await fetch(`${API}/api/admin/content${path}`, {
  method,
  headers: { ...(payload ? { "Content-Type": "application/json" } : {}), Authorization: `Bearer ${token ?? ""}` },
  ...(payload ? { body: JSON.stringify(payload) } : {})
 });
 const data = await response.json();
 if (!response.ok) throw new Error(data.error ?? `Erreur ${response.status}`);
 return data;
}

export default function ContentManager() {
 const [contact, setContact] = useState<Contact>({ contact_email: "", linkedin_url: "", github_url: "", website_url: "" });
 const [education, setEducation] = useState<Education[]>([]);
 const [messages, setMessages] = useState<Message[]>([]);
 const [form, setForm] = useState<EducationForm>(emptyEducation);
 const [editing, setEditing] = useState<number | null>(null);
 const [status, setStatus] = useState("");
 const [busy, setBusy] = useState(false);

 async function refresh() {
  const [c, e, m] = await Promise.all([request("/contact"), request("/education"), request("/messages")]);
  setContact({ contact_email: c.contact_email ?? "", linkedin_url: c.linkedin_url ?? "", github_url: c.github_url ?? "", website_url: c.website_url ?? "" });
  setEducation(e); setMessages(m);
 }
 useEffect(() => { void refresh().catch(e => setStatus(e.message)); }, []);

 async function saveContact(event: FormEvent) {
  event.preventDefault(); setBusy(true); setStatus("");
  try { await request("/contact", "PUT", contact); setStatus("Coordonnées enregistrées."); }
  catch(e) { setStatus(e instanceof Error ? e.message : "Erreur"); }
  finally { setBusy(false); }
 }
 async function saveEducation(event: FormEvent) {
  event.preventDefault(); setBusy(true); setStatus("");
  try {
   const payload={...form, end_date: form.end_date || null, sort_order: Number(form.sort_order)};
   await request(editing === null ? "/education" : `/education/${editing}`, editing === null ? "POST" : "PUT", payload);
   setForm(emptyEducation); setEditing(null); await refresh(); setStatus("Formation enregistrée.");
  } catch(e) { setStatus(e instanceof Error ? e.message : "Erreur"); }
  finally { setBusy(false); }
 }
 async function removeEducation(id: number) {
  if (!confirm("Supprimer cette formation ?")) return;
  try { await request(`/education/${id}`, "DELETE"); await refresh(); setStatus("Formation supprimée."); }
  catch(e) { setStatus(e instanceof Error ? e.message : "Erreur"); }
 }
 async function removeMessage(id: number) {
  if (!confirm("Supprimer ce message ?")) return;
  try { await request(`/messages/${id}`, "DELETE"); await refresh(); setStatus("Message supprimé."); }
  catch(e) { setStatus(e instanceof Error ? e.message : "Erreur"); }
 }

 return <>
  <section className="admin-panel" id="admin-contact">
   <h2>Coordonnées de contact</h2>
   <form className="admin-form" onSubmit={saveContact}>
    {([
     ["contact_email", "Courriel public", "email"],
     ["linkedin_url", "Lien LinkedIn", "url"],
     ["github_url", "Lien GitHub", "url"],
     ["website_url", "Site personnel", "url"]
    ] as const).map(([key,label,type]) => <label key={key}>{label}
     <input type={type} value={contact[key]} onChange={e=>setContact(p=>({...p,[key]:e.target.value}))}/>
    </label>)}
    <button className="primary" disabled={busy}>Enregistrer les coordonnées</button>
   </form>
  </section>
  <section className="admin-panel" id="admin-education">
   <h2>{editing === null ? "Ajouter une formation" : "Modifier la formation"}</h2>
   <form className="admin-form" onSubmit={saveEducation}>
    <label>Diplôme / formation<input required maxLength={150} value={form.degree} onChange={e=>setForm(p=>({...p,degree:e.target.value}))}/></label>
    <label>Établissement<input required maxLength={150} value={form.school} onChange={e=>setForm(p=>({...p,school:e.target.value}))}/></label>
    <label>Date de début<input required type="date" value={form.start_date} onChange={e=>setForm(p=>({...p,start_date:e.target.value}))}/></label>
    <label>Date de fin (facultative)<input type="date" value={form.end_date} onChange={e=>setForm(p=>({...p,end_date:e.target.value}))}/></label>
    <label>Description<textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></label>
    <label>Ordre<input type="number" value={form.sort_order} onChange={e=>setForm(p=>({...p,sort_order:Number(e.target.value)}))}/></label>
    <div className="admin-actions"><button className="primary" disabled={busy}>Enregistrer la formation</button>
     {editing !== null && <button type="button" className="secondary" onClick={()=>{setEditing(null);setForm(emptyEducation);}}>Annuler</button>}</div>
   </form>
   {education.map(e => <div className="admin-project" key={e.id}>
    <div><h3>{e.degree}</h3><p>{e.school} · {e.start_date} — {e.end_date ?? "En cours"}</p></div>
    <div className="admin-actions">
     <button type="button" className="secondary" onClick={()=>{setEditing(e.id);setForm({...e,end_date:e.end_date ?? "",description:e.description??""});document.getElementById("admin-education")?.scrollIntoView({behavior:"smooth"});}}>Modifier</button>
     <button type="button" className="admin-delete" onClick={()=>void removeEducation(e.id)}>Supprimer</button>
    </div>
   </div>)}
  </section>
  <section className="admin-panel" id="admin-messages">
   <h2>Messages reçus ({messages.length})</h2>
   {messages.length === 0 && <p>Aucun message pour le moment.</p>}
   {messages.map(m => <article className="admin-project" key={m.id}>
    <div><h3>{m.subject}</h3><p><strong>{m.sender_name}</strong> · <a href={`mailto:${m.sender_email}`}>{m.sender_email}</a></p>
     <p>{m.message}</p><small>{new Date(m.created_at).toLocaleString("fr-CA")}</small></div>
    <button type="button" className="admin-delete" onClick={()=>void removeMessage(m.id)}>Supprimer</button>
   </article>)}
  </section>
  {status && <p className="admin-message" role="status">{status}</p>}
 </>;
}
