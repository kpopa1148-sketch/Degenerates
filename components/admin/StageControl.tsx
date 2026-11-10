"use client";
import { useCallback, useEffect, useState } from "react"; import { toast } from "@/components/ui/Toaster";
export default function StageControl() {
  const [d, setD] = useState<any>(null);
  const load = useCallback(() => fetch("/api/admin/stage").then((r) => r.json()).then((x) => !x.error && setD(x)).catch(() => {}), []);
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);
  const act = async (action: "finish" | "restart", ask: string) => {
    if (!confirm(ask)) return;
    const r = await fetch("/api/admin/stage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    if (r.ok) { toast(action === "finish" ? "Этап 1 завершён, 2 номинации прошли" : "Возврат к этапу 1"); load(); setTimeout(() => location.reload(), 800); } else toast("Ошибка", "err");
  };
  const st = d?.stage;
  return (<section className="glass mb-8 rounded-card p-5"><h2 className="title mb-2 text-2xl">Этапы премии</h2>
    <p className="text-sm text-silver">Сейчас: <b className="text-gold">{st === "nominations" ? "Этап 1 — выбор доп. номинаций" : st === "candidates" ? "Этап 2 — голосование за кандидатов" : "…"}</b></p>
    <ul className="mt-3 text-sm">{d?.nominations?.map((n: any) => <li key={n.id} className="flex justify-between border-b border-white/5 py-1"><span>{n.title} {st === "candidates" && (n.is_active ? "✅ прошла" : "— не прошла")}</span><span className="text-muted">{n.picks} выбрали</span></li>)}</ul>
    <div className="mt-4 flex flex-wrap gap-3">
      {st === "nominations" && <button className="btn" onClick={() => act("finish", "Завершить этап 1? 2 самые популярные доп. номинации пройдут, остальные скроются.")}>Завершить этап 1 и выбрать 2 лучшие</button>}
      {st === "candidates" && <button className="btn btn-ghost" onClick={() => act("restart", "Вернуться к этапу 1? Все 6 доп. номинаций снова станут доступны для выбора.")}>Вернуться к этапу 1</button>}</div>
    <p className="mt-3 text-xs text-muted">Совет: пока идёт этап 1, добавляйте кандидатов в номинации заранее. Голосование за кандидатов откроется после завершения этапа 1.</p></section>);
}
