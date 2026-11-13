"use client";
import { useEffect, useState } from "react"; import { Check } from "lucide-react"; import { toast } from "@/components/ui/Toaster";
type N = { id: string; title: string; description: string };
export default function PickBoard({ noms, open, logged }: { noms: N[]; open: boolean; logged: boolean }) {
  const [picks, setPicks] = useState<string[]>([]); const [busy, setBusy] = useState(false);
  useEffect(() => { if (logged) fetch("/api/picks").then((r) => r.json()).then((d) => setPicks(d.picks ?? [])).catch(() => toast("Не удалось загрузить ваш выбор", "err")); }, [logged]);
  const toggle = async (id: string) => {
    if (!logged) return toast("Сначала войдите через Discord", "err");
    const on = !picks.includes(id);
    if (on && picks.length >= 2) return toast("Можно выбрать только 2 номинации", "err");
    setBusy(true);
    try {
      const r = await fetch("/api/picks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nominationId: id, on }) }); const d = await r.json();
      if (!r.ok) toast(d.error ?? "Ошибка", "err"); else { setPicks((p) => (on ? [...p, id] : p.filter((x) => x !== id))); toast(on ? "Номинация выбрана" : "Выбор снят"); }
    } catch { toast("Нет соединения", "err"); } finally { setBusy(false); }
  };
  return (<div>
    <div className="glass mb-6 rounded-card p-5"><p className="title text-2xl gold-text">Этап 1 из 2</p>
      <p className="mt-2 text-silver">Выберите <b>2 дополнительные номинации</b>, которые должны попасть в премию. Две самые популярные пройдут дальше, и тогда начнётся голосование за кандидатов. Выбрано: {picks.length} из 2.</p></div>
        {picks.length > 0 && <p className="glass mb-4 rounded-xl border-gold/40 p-4">Вы выбрали: <b className="text-gold">{noms.filter((n) => picks.includes(n.id)).map((n) => n.title).join(", ")}</b></p>}
    {!open && <p className="glass mb-4 rounded-xl p-4 text-center text-red-300">Голосование закрыто</p>}
    <div className="grid gap-4 md:grid-cols-2">{noms.map((n) => { const sel = picks.includes(n.id); return (
      <button key={n.id} disabled={!open || busy} onClick={() => toggle(n.id)} aria-pressed={sel}
        className={`glass min-h-[88px] rounded-card p-5 text-left transition hover:-translate-y-1 ${sel ? "border-gold shadow-gold" : "hover:shadow-glow"}`}>
        <div className="flex items-center justify-between gap-3"><h3 className="title text-2xl">{n.title}</h3>{sel && <Check className="text-gold" />}</div>
        <p className="mt-1 text-sm text-muted">{n.description}</p></button>); })}</div></div>);
}
