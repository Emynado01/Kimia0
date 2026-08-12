import { NextResponse } from "next/server";
import { clearAdminSession } from "../../../../lib/admin-auth";

export async function POST() {
  await clearAdminSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set("kimia_admin_session", "", { path: "/", expires: new Date(0), httpOnly: true, sameSite: "strict" });
  return response;
}
