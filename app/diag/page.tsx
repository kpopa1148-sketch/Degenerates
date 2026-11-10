import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export default async function Diag() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const out: Record<string, unknown> = {
    url_ok: /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url),
    url_starts: url.slice(0, 12),
    key_len: key.length,
    key_starts: key.slice(0, 4),
    key_has_space: key !== key.trim(),
    secret_len: (process.env.VOTING_SECRET ?? "").length,
  };
  try {
    const db = createClient(url, key, { auth: { persistSession: false } });
    const a = await db.from("nominations").select("id", { count: "exact", head: true });
    out.nominations = a.error ? a.error.message : a.count;
    const b = await db.from("nominations").select("id, candidates(id)").limit(1);
    out.join = b.error ? b.error.message : "ok";
    const c = await db.rpc("nomination_vote_counts");
    out.counts_fn = c.error ? c.error.message : "ok";
    const d = await db.rpc("voting_is_open");
    out.open_fn = d.error ? d.error.message : "ok";
  } catch (e) {
    out.exception = String(e);
  }
  return <pre style={{ padding: 24, whiteSpace: "pre-wrap" }}>{JSON.stringify(out, null, 2)}</pre>;
}
