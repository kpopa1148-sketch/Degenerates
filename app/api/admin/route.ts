import { NextResponse } from "next/server"; import { z } from "zod"; import { requireAdmin } from "@/lib/auth/session"; import { supabaseAdmin } from "@/lib/supabase/admin";
const id = z.string().uuid();
const A = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set_voting"), open: z.boolean(), endsAt: z.string().datetime().nullable().optional() }),
  z.object({ action: z.literal("set_setting"), key: z.enum(["public_live_results", "results_published", "site_maintenance"]), value: z.boolean() }),
  z.object({ action: z.literal("update_nomination"), id, title: z.string().trim().min(2).max(80).optional(), description: z.string().trim().max(300).optional(), is_active: z.boolean().optional() }),
  z.object({ action: z.literal("add_candidate"), nominationId: id, discordId: z.string().regex(/^\d{15,22}$/), username: z.string().trim().min(1).max(64), avatarHash: z.string().max(64).nullable().optional() }),
  z.object({ action: z.literal("delete_candidate"), id }),
  z.object({ action: z.literal("review_submission"), id, approve: z.boolean() }),
  z.object({ action: z.literal("reset_votes"), confirm: z.literal("СБРОСИТЬ") }),
]).refine(() => true);
const guard = async () => { try { return await requireAdmin(); } catch { return null; } };

export async function GET() {
  const s = await guard(); if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = supabaseAdmin(); const since = new Date(Date.now() - 5 * 60_000).toISOString(); const day = new Date(Date.now() - 24 * 3600_000).toISOString();
  const [u, v, r5, voters, subs, logs, res, recent, cands] = await Promise.all([
    db.from("users").select("id", { count: "exact", head: true }), db.from("votes").select("id", { count: "exact", head: true }),
    db.from("votes").select("id", { count: "exact", head: true }).gte("created_at", since), db.from("votes").select("user_id"),
    db.from("candidate_submissions").select("*, nominations(title), users:submitted_by(username)").eq("status", "pending").order("created_at"),
    db.from("activity_logs").select("action,entity_type,metadata,created_at, users(username)").order("created_at", { ascending: false }).limit(30),
    db.rpc("get_results", { p_is_admin: true }), db.from("votes").select("created_at").gte("created_at", day), db.from("candidates").select("id,nomination_id,discord_id,username"),
  ]);
  const byHour: Record<string, number> = {}; (recent.data ?? []).forEach((x: any) => { const k = x.created_at.slice(11, 13) + ":00"; byHour[k] = (byHour[k] ?? 0) + 1; });
  const leaders: Record<string, any> = {}; (res.data ?? []).forEach((x: any) => { if (!leaders[x.nomination_id] && Number(x.votes) > 0) leaders[x.nomination_id] = x; });
  return NextResponse.json({ users: u.count ?? 0, votes: v.count ?? 0, voters: new Set((voters.data ?? []).map((x: any) => x.user_id)).size, last5: r5.count ?? 0,
    submissions: subs.data ?? [], logs: logs.data ?? [], leaders, chart: Object.entries(byHour).sort().map(([h, n]) => ({ h, n })), candidates: res.data ?? cands.data ?? [] });
}

export async function POST(req: Request) {
  const s = await guard(); if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = A.safeParse(await req.json().catch(() => null)); if (!p.success) return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  const db = supabaseAdmin(); const a = p.data; const now = new Date().toISOString(); let err: any = null; let meta: any = a;
  const set = (key: string, value: any) => db.from("settings").upsert({ key, value, updated_at: now });
  switch (a.action) {
    case "set_voting": { const r1 = await set("voting_open", a.open); if (a.endsAt !== undefined) err = (await set("voting_ends_at", a.endsAt)).error; err = err ?? r1.error; break; }
    case "set_setting": err = (await set(a.key, a.value)).error; break;
    case "update_nomination": { const { id: nid, action, ...f } = a; err = (await db.from("nominations").update({ ...f, updated_at: now }).eq("id", nid)).error; break; }
    case "add_candidate": err = (await db.from("candidates").insert({ nomination_id: a.nominationId, discord_id: a.discordId, username: a.username, avatar_hash: a.avatarHash ?? null })).error; break;
    case "delete_candidate": err = (await db.from("candidates").delete().eq("id", a.id)).error; break;
    case "review_submission": {
      const { data: sub } = await db.from("candidate_submissions").select("*").eq("id", a.id).eq("status", "pending").single(); if (!sub) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
      if (a.approve) { const r = await db.from("candidates").insert({ nomination_id: sub.nomination_id, discord_id: sub.candidate_discord_id, username: sub.candidate_name }); if (r.error && r.error.code !== "23505") { err = r.error; break; } }
      err = (await db.from("candidate_submissions").update({ status: a.approve ? "approved" : "rejected", reviewed_by: s.uid, reviewed_at: now }).eq("id", a.id)).error; break; }
    case "reset_votes": err = (await db.from("votes").delete().neq("id", "00000000-0000-0000-0000-000000000000")).error; meta = { action: a.action }; break;
  }
  if (err) return NextResponse.json({ error: err.code === "23505" ? "Дубликат" : "Ошибка сервера" }, { status: err.code === "23505" ? 409 : 500 });
  await db.from("activity_logs").insert({ user_id: s.uid, action: `admin_${a.action}`, entity_type: "admin", metadata: meta });
  return NextResponse.json({ ok: true });
}
