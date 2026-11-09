import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
export type Candidate = { id: string; nomination_id: string; discord_id: string; username: string; avatar_hash: string | null; description: string | null };
export type Nomination = { id: string; title: string; description: string; type: "main" | "additional"; is_active: boolean; sort_order: number; candidates: Candidate[]; total: number };

export async function getSettings() {
  const { data } = await supabaseAdmin().from("settings").select("key,value");
  const s: Record<string, any> = {};
  (data ?? []).forEach((r) => (s[r.key] = r.value));
  await supabaseAdmin().rpc("voting_is_open"); // серверное автозакрытие
  const { data: o } = await supabaseAdmin().from("settings").select("value").eq("key", "voting_open").single();
  s.voting_open = o?.value ?? false;
  return s;
}
export async function getNominations(includeInactive = false): Promise<Nomination[]> {
  const db = supabaseAdmin();
  let q = db.from("nominations").select("*, candidates(*)").order("sort_order");
  if (!includeInactive) q = q.eq("is_active", true);
  const [{ data, error }, { data: counts }] = await Promise.all([q, db.rpc("nomination_vote_counts")]);
  if (error) throw new Error("db");
  const m = new Map((counts ?? []).map((c: any) => [c.nomination_id, Number(c.total)]));
  return (data ?? []).map((n: any) => ({ ...n, total: m.get(n.id) ?? 0 }));
}
export async function getStats() {
  const db = supabaseAdmin();
  const [u, v, c] = await Promise.all([
    db.from("users").select("id", { count: "exact", head: true }),
    db.from("votes").select("id", { count: "exact", head: true }),
    db.from("candidates").select("id", { count: "exact", head: true }),
  ]);
  return { users: u.count ?? 0, votes: v.count ?? 0, candidates: c.count ?? 0 };
}
