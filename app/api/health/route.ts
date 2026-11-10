import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    secret: (process.env.VOTING_SECRET ?? "").length >= 32,
  };
  if (!env.url || !env.service_key) return NextResponse.json({ step: "env", env });
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const n = await db.from("nominations").select("id", { count: "exact", head: true });
  const r = await db.rpc("nomination_vote_counts");
  const o = await db.rpc("voting_is_open");
  return NextResponse.json({
    env,
    nominations: n.error ? n.error.message : n.count,
    nomination_vote_counts: r.error ? r.error.message : "ok",
    voting_is_open: o.error ? o.error.message : "ok",
  });
}
