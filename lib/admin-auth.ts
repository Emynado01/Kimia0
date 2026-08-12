import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getNeonSql } from "../db";

const SESSION_COOKIE = "kimia_admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

type AdminRow = { id: string; email: string; role: "ADMIN" | "STAFF" | "CUSTOMER"; is_active: boolean; password_hash: string | null; password_salt: string | null };
type SessionRow = { user_id: string; email: string; name: string | null; role: "ADMIN" | "STAFF" | "CUSTOMER"; expires_at: string | Date };
export type AdminSession = { userId: string; email: string; name: string | null; role: "ADMIN" | "STAFF" };

export async function authenticateAdmin(email: string, password: string) {
  const users = await getNeonSql().query("SELECT id, email, role, is_active, password_hash, password_salt FROM users WHERE email = $1 LIMIT 1", [email.trim().toLowerCase()]) as AdminRow[];
  const user = users[0];
  if (!user || !user.is_active || (user.role !== "ADMIN" && user.role !== "STAFF") || !user.password_hash || !user.password_salt) return null;
  return (await verifyPassword(password, user.password_salt, user.password_hash)) ? user : null;
}

export async function createAdminSession(userId: string) {
  const sessionId = randomToken(); const expiresAt = new Date(Date.now() + SESSION_DURATION_MS); const sql = getNeonSql();
  await sql.query("DELETE FROM admin_sessions WHERE expires_at <= now()");
  await sql.query("INSERT INTO admin_sessions (id, user_id, expires_at, created_at) VALUES ($1, $2, $3, now())", [sessionId, userId, expiresAt.toISOString()]);
  return { sessionId, expiresAt };
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  const rows = await getNeonSql().query("SELECT s.user_id, s.expires_at, u.email, u.name, u.role FROM admin_sessions s INNER JOIN users u ON u.id = s.user_id WHERE s.id = $1 AND s.expires_at > now() AND u.is_active = true LIMIT 1", [sessionId]) as SessionRow[];
  const row = rows[0]; if (!row || (row.role !== "ADMIN" && row.role !== "STAFF")) return null;
  return { userId: row.user_id, email: row.email, name: row.name, role: row.role };
}

export async function requireAdmin() { const session = await getAdminSession(); if (!session) redirect("/admin/login"); return session; }
export function adminSessionCookie(sessionId: string, expiresAt: Date) { return { name: SESSION_COOKIE, value: sessionId, options: { httpOnly: true, sameSite: "strict" as const, secure: process.env.NODE_ENV === "production", expires: expiresAt, path: "/" } }; }
export async function clearAdminSession() { const sessionId = (await cookies()).get(SESSION_COOKIE)?.value; if (sessionId) await getNeonSql().query("DELETE FROM admin_sessions WHERE id = $1", [sessionId]); }

async function verifyPassword(password: string, salt: string, expectedHash: string) { const encoder = new TextEncoder(); const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]); const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: 100000 }, key, 256); return timingSafeEqual(new Uint8Array(bits), base64ToBytes(expectedHash)); }
function randomToken() { const bytes = crypto.getRandomValues(new Uint8Array(32)); return bytesToBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""); }
function base64ToBytes(value: string) { const bin = atob(value); return Uint8Array.from(bin, (character) => character.charCodeAt(0)); }
function bytesToBase64(bytes: Uint8Array) { let binary = ""; bytes.forEach((value) => { binary += String.fromCharCode(value); }); return btoa(binary); }
function timingSafeEqual(a: Uint8Array, b: Uint8Array) { if (a.length !== b.length) return false; let result = 0; for (let index = 0; index < a.length; index += 1) result |= a[index] ^ b[index]; return result === 0; }
