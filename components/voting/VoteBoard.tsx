"use client";
import { useEffect, useState } from "react"; import { motion, AnimatePresence } from "framer-motion"; import { Check, Plus } from "lucide-react";
import type { Nomination } from "@/lib/data"; import { avatarUrl } from "@/lib/discord/avatar"; import { toast } from "@/components/ui/Toaster";
export default function VoteBoard({ noms, open, logged }: { noms: Nomination[]; open: boolean; logged: boolean }) {
  const [mine, setMine] = useState<Record<string, string>>({}); const [busy, setBusy] = useState<string | null>(null); const [sug, setSug] = useState<string | null>(null);
  useEffect(() => { if (logged) fetch("/api/votes").then((r) => r.json()).then((d) => setMine(Object.fromEntries((d.votes ?? []).map((v: any) => [v.nomination_id, v.candidate_id])))).catch(() => toast("Не удалось загрузить ваши голоса", "err")); }, [logged]);
  const vote = async (nominationId: string, candidateId: string) => {
    if (!logged) return toast("Сначала войдите через Discord", "err"); setBusy(candidateId);
    try { const r = await fetch("/api/votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nominationId, candidateId }) }); const d = await r.json();
      if (!r.ok) toast(d.error ?? "Ошибка голосования", "err"); else { setMine((m) => ({ ...m, [nominationId]: candidateId })); toast(d.changed ? "Голос изменён" : "Голос сохранён"); } }
    catch { toast("Нет соединения", "err"); } finally { setBusy(null); } };
  const submit = async (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = new FormData(e.currentTarget);
    const r = await fetch("/api/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nominationId: sug, candidateDiscordId: f.get("id"), candidateName: f.get("name"), reason: f.get("reason") }) }); const d = await r.json();
    if (r.ok) { toast("Предложение отправлено"); setSug(null); } else toast(d.error ?? "Ошибка", "err"); };
  return (<div className="space-y-10">{!open && <p className="glass rounded-xl p-4 text-center text-red-300">Голосование закрыто</p>}
    {noms.map((n) => (<section key={n.id} id={n.id} className="glass rounded-card p-5 scroll-mt-24"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className={`title text-3xl ${n.type === "main" ? "gold-text" : ""}`}>{n.title}</h2>
      <span className="text-xs text-muted">{n.total} голосов</span></div><p className="text-sm text-muted">{n.description}</p>
      {n.candidates.length === 0 ? <p className="mt-4 text-muted">Кандидатов пока нет — предложите первого.</p> :
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{n.candidates.map((c) => { const sel = mine[n.id] === c.id; return (
        <motion.button key={c.id} whileHover={{ y: -3 }} whileTap={{ scale: .97 }} disabled={!open || busy === c.id} onClick={() => vote(n.id, c.id)} aria-pressed={sel}
          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${sel ? "border-gold bg-gold/10 shadow-gold" : "border-white/10 hover:border-violet"}`}>
          <img loading="lazy" src={avatarUrl(c.discord_id, c.avatar_hash, 64)} alt="" className="h-12 w-12 rounded-full" /><span className="flex-1 font-semibold">{c.username}</span>
          <AnimatePresence>{sel && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-gold"><Check /></motion.span>}</AnimatePresence></motion.button>); })}</div>}
      {logged && <button className="mt-4 flex items-center gap-1 text-sm text-violet-glow" onClick={() => setSug(n.id)}><Plus size={14} />Предложить кандидата</button>}</section>))}
    {sug && <div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal><form onSubmit={submit} className="glass w-full max-w-md space-y-3 rounded-card bg-graphite p-6">
      <h3 className="title text-2xl">Предложить кандидата</h3>
      <input name="id" required pattern="\d{15,22}" placeholder="Discord User ID" className="w-full rounded-lg bg-black/40 p-3" />
      <input name="name" required minLength={2} maxLength={64} placeholder="Имя кандидата" className="w-full rounded-lg bg-black/40 p-3" />
      <textarea name="reason" required minLength={10} maxLength={500} placeholder="Почему он достоин?" className="w-full rounded-lg bg-black/40 p-3" rows={3} />
      <div className="flex gap-2"><button className="btn">Отправить</button><button type="button" className="btn btn-ghost" onClick={() => setSug(null)}>Отмена</button></div></form></div>}</div>);
}
