"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); setPending(true); const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) }); setPending(false); if (!response.ok) { const body = await response.json().catch(() => null); setError(body?.error ?? "Connexion impossible."); return; } router.replace("/admin"); router.refresh(); }
  return <main className="admin-login"><a href="/" className="wordmark">Simire<span>·</span></a><form onSubmit={submit}><p className="eyebrow">Accès sécurisé</p><h1>Administration</h1><p>Connectez-vous pour gérer les articles, le stock et les ventes de Simire.</p><label>E-mail<input value={email} type="email" required autoComplete="email" onChange={(event) => setEmail(event.target.value)} /></label><label>Mot de passe<input value={password} type="password" required autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button disabled={pending} className="button button-dark wide">{pending ? "Connexion…" : "Se connecter"} <span>→</span></button><a href="/" className="back-home">← Revenir à la boutique</a></form></main>;
}
