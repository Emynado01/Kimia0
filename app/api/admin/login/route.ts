import { NextResponse } from "next/server";
import { adminSessionCookie, authenticateAdmin, createAdminSession } from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const { email, password } = payload as Record<string, unknown>;
  if (typeof email !== "string" || typeof password !== "string" || password.length > 200) return NextResponse.json({ error: "Identifiants invalides." }, { status: 400 });
  const user = await authenticateAdmin(email, password);
  if (!user) return NextResponse.json({ error: "E-mail ou mot de passe incorrect." }, { status: 401 });
  const session = await createAdminSession(user.id);
  const response = NextResponse.json({ ok: true });
  const cookie = adminSessionCookie(session.sessionId, session.expiresAt);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
