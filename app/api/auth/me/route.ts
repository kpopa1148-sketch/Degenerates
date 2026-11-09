import { NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { avatarUrl } from "@/lib/discord/oauth";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ user: null });
  const { data } = await supabaseAdmin().from("users").select("discord_id,username,global_name,avatar_hash").eq("id", s.uid).single();
  if (!data) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { ...data, avatarUrl: avatarUrl(data.discord_id, data.avatar_hash), isAdmin: isAdmin(s) } });
}
