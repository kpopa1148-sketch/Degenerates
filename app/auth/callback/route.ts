import { NextRequest, NextResponse } from "next/server";
import { exchangeAndFetchUser } from "@/lib/discord/oauth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSessionToken, cookieOpts, SESSION_COOKIE } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const fail = (e: string) => {
    const r = NextResponse.redirect(`${site}/?auth=${e}`);
    r.cookies.delete("da_state");
    return r;
  };
  const sp = req.nextUrl.searchParams;
  const code = sp.get("code"), state = sp.get("state");
  const saved = req.cookies.get("da_state")?.value;
  if (sp.get("error")) return fail("denied");
  if (!code || !state || !saved || state !== saved) return fail("state");
  try {
    const u = await exchangeAndFetchUser(code);
    const db = supabaseAdmin();
    const { data, error } = await db.from("users").upsert(
      { discord_id: u.id, username: u.username, global_name: u.global_name, avatar_hash: u.avatar, updated_at: new Date().toISOString() },
      { onConflict: "discord_id" }).select("id").single();
    if (error || !data) return fail("server");
    await db.from("activity_logs").insert({ user_id: data.id, action: "login", entity_type: "user", entity_id: u.id });
    const res = NextResponse.redirect(`${site}/?auth=ok`);
    res.cookies.set(SESSION_COOKIE, createSessionToken(data.id, u.id), cookieOpts());
    res.cookies.delete("da_state");
    return res;
  } catch { return fail("oauth"); }
}
