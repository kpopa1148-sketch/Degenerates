"use client";
import { motion } from "framer-motion"; import Link from "next/link"; import { useEffect, useState } from "react"; import { Trophy } from "lucide-react";
function Countdown({ endsAt, open }: { endsAt: string | null; open: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (!endsAt || now === null) return <p className="text-muted">Дата окончания не назначена</p>;
  let d = Math.max(0, new Date(endsAt).getTime() - now); const p = [["дн", 864e5], ["ч", 36e5], ["мин", 6e4], ["сек", 1e3]].map(([l, m]) => { const v = Math.floor(d / +m); d -= v * +m; return [l, v]; });
  return <div className="flex gap-3" aria-label="Обратный отсчёт">{p.map(([l, v]) => <div key={l} className="glass w-20 rounded-xl py-3 text-center"><div className="title text-3xl gold-text">{String(v).padStart(2, "0")}</div><div className="text-xs text-muted">{l}</div></div>)}</div>;
}
export default function Hero({ open, endsAt }: { open: boolean; endsAt: string | null }) {
  return (<section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
    <div aria-hidden className="absolute inset-0">{Array.from({ length: 28 }).map((_, i) => <span key={i} className="spark" style={{ left: `${(i * 37) % 100}%`, animationDuration: `${8 + (i % 7) * 2}s`, animationDelay: `${(i % 9) * -1.5}s` }} />)}
      <div className="absolute left-1/2 top-1/3 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-violet/30 blur-[140px]" /></div>
    <motion.div initial={{ opacity: 0, scale: .7, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 1 }} className="float relative">
      <Trophy size={150} strokeWidth={1} className="text-gold drop-shadow-[0_0_40px_rgba(245,196,81,.7)]" /></motion.div>
    <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3, duration: .8 }} className="title relative text-[clamp(3rem,11vw,9rem)] gold-text">Degenerates<br />Awards</motion.h1>
    <p className="relative mt-4 max-w-xl text-lg text-silver">Самая сомнительная премия твоего Discord-сервера</p>
    <div className="relative mt-8 flex flex-col items-center gap-5"><span className={`rounded-full px-4 py-1 text-sm font-bold ${open ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>{open ? "Голосование открыто" : "Голосование закрыто"}</span>
      {open && <Countdown endsAt={endsAt} open={open} />}<Link href="/vote" className="btn">ПЕРЕЙТИ К ГОЛОСОВАНИЮ</Link></div></section>);
}
