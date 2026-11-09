import Reveal, { Row } from "@/components/results/Reveal"; import { supabaseAdmin } from "@/lib/supabase/admin"; import { getSession, isAdmin } from "@/lib/auth/session"; import { getNominations } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function Page() {
  const { data, error } = await supabaseAdmin().rpc("get_results", { p_is_admin: isAdmin(await getSession()) });
  const hidden = error?.message.includes("RESULTS_HIDDEN");
  if (error && !hidden) throw new Error("db");
  const head = <h1 className="title mb-8 text-6xl gold-text">Результаты</h1>;
  if (hidden) return <div className="mx-auto max-w-3xl px-4 py-24 text-center">{head}<p className="text-muted">Результаты скрыты до окончания голосования.</p></div>;
  const noms = await getNominations(); const rows = (data ?? []) as Row[];
  const groups = noms.map((n) => ({ id: n.id, title: n.title, rows: rows.filter((r) => r.nomination_id === n.id).map((r) => ({ ...r, votes: Number(r.votes), pct: r.pct === null ? null : Number(r.pct) })) }));
  return <div className="mx-auto max-w-6xl px-4 py-12">{head}{noms.length ? <Reveal groups={groups} /> : <p className="text-muted">Данных пока нет</p>}</div>;
}
