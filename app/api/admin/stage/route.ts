import { NextResponse } from "next/server"; import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session"; import { supabaseAdmin } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";
const guard = async () => { try { return await requireAdmin(); } catch { return null; } };
export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = supabaseAdmin();
  const [st, noms, picks] = await Promise.all([
    db.from("settings").select("value").eq("key", "stage").maybeSingle(),
    db.from("nominations").select("id,title,is_active,sort_order").eq("type", "additional").order("sort_order"),
    db.from("nomination_picks").select("nomination_id"),
  ]);
  const c: Record<string, number> = {}; (picks.data ?? []).forEach((p) => (c[p.nomination_id] = (c[p.nomination_id] ?? 0) + 1));
  const list = (noms.data ?? []).map((n) => ({ ...n, picks: c[n.id] ?? 0 })).sort((a, b) => b.picks - a.picks);
  return NextResponse.json({ stage: st.data?.value ?? "candidates", nominations: list });
}
export async function POST(req: Request) {
  const s = await guard(); if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object({ action: z.enum(["finish", "restart"]) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  const db = supabaseAdmin(); const now = new Date().toISOString();
  if (p.data.action === "finish") {
    const { error } = await db.rpc("finish_stage1"); if (error) return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  } else {
    const a = await db.from("settings").upsert({ key: "stage", value: "nominations", updated_at: now });
    const b = await db.from("nominations").update({ is_active: true, updated_at: now }).eq("type", "additional");
    if (a.error || b.error) return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
  await db.from("activity_logs").insert({ user_id: s.uid, action: `admin_stage_${p.data.action}`, entity_type: "admin" });
  return NextResponse.json({ ok: true });
}
