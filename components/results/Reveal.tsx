"use client";
import { useState } from "react"; import { AnimatePresence, motion } from "framer-motion"; import { Trophy } from "lucide-react"; import { avatarUrl } from "@/lib/discord/avatar";
export type Row = { nomination_id: string; candidate_id: string; discord_id: string; username: string; avatar_hash: string | null; votes: number; pct: number | null };
export default function Reveal({ groups }: { groups: { id: string; title: string; rows: Row[] }[] }) {
  const [shown, setShown] = useState<Set<string>>(new Set()); const [cur, setCur] = useState<{ t: string; w: Row } | null>(null);
  const announce = (g: { id: string; title: string; rows: Row[] }) => { if (!g.rows[0] || g.rows[0].votes === 0) return; setCur({ t: g.title, w: g.rows[0] }); setTimeout(() => { setShown((s) => new Set(s).add(g.id)); setCur(null); }, 4500); };
  const medal = ["text-gold border-gold/60 shadow-gold", "text-silver border-silver/50", "text-bronze border-bronze/50"];
  return (<><div className="space-y-8">{groups.map((g) => (<section key={g.id} className="glass rounded-card p-5"><div className="flex items-center justify-between"><h2 className="title text-3xl">{g.title}</h2>
    {!shown.has(g.id) && g.rows[0]?.votes > 0 && <button className="btn text-sm" onClick={() => announce(g)}>Объявить победителя</button>}</div>
    {g.rows.length === 0 ? <p className="mt-3 text-muted">Нет кандидатов</p> : <div className="mt-4 grid gap-3 md:grid-cols-3">{g.rows.slice(0, 3).map((r, i) => (
      <div key={r.candidate_id} className={`rounded-xl border bg-black/30 p-4 ${medal[i]} ${i === 0 ? "md:order-2 md:scale-105" : i === 1 ? "md:order-1" : "md:order-3"}`}>
        <div className="text-xs font-bold">{i + 1} МЕСТО</div><div className="mt-2 flex items-center gap-3"><img loading="lazy" src={avatarUrl(r.discord_id, r.avatar_hash, 64)} alt="" className="h-12 w-12 rounded-full" /><div><div className="font-bold text-white">{r.username}</div><div className="text-sm">{r.votes} · {r.pct ?? 0}%</div></div></div></div>))}</div>}</section>))}</div>
    <AnimatePresence>{cur && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[95] grid place-items-center bg-black/90 p-6 text-center">
      <div><p className="title text-2xl text-silver md:text-4xl">И лауреатом Degenerates Awards в номинации «{cur.t}» становится...</p>
        <motion.div initial={{ opacity: 0, scale: .5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.5, duration: 1 }} className="mt-8"><Trophy size={90} className="mx-auto text-gold float" />
          <img src={avatarUrl(cur.w.discord_id, cur.w.avatar_hash, 128)} alt="" className="mx-auto mt-4 h-28 w-28 rounded-full ring-4 ring-gold shadow-gold" /><p className="title gold-text mt-4 text-6xl md:text-8xl">{cur.w.username}</p><p className="mt-2 text-silver">{cur.w.votes} голосов · {cur.w.pct}%</p></motion.div></div></motion.div>}</AnimatePresence></>);
}
