"use client";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "@/components/ui/Toaster";

type N = { id: string; title: string; description: string };

export default function PickBoard({ noms, open, logged }: { noms: N[]; open: boolean; logged: boolean }) {
  const [saved, setSaved] = useState<string[]>([]);
  const [draft, setDraft] = useState<string[]>([]);
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!logged) return;
    fetch("/api/picks")
      .then((r) => r.json())
      .then((d) => {
        setSaved(d.picks ?? []);
        setDraft(d.picks ?? []);
      })
      .catch(() => toast("Не удалось загрузить ваш выбор", "err"));
  }, [logged]);

  const toggle = (id: string) => {
    if (!logged) return toast("Сначала войдите через Discord", "err");
    if (!open) return toast("Голосование закрыто", "err");
    if (draft.includes(id)) return setDraft(draft.filter((x) => x !== id));
    if (draft.length >= 2) return toast("Можно выбрать только 2 номинации", "err");
    setDraft([...draft, id]);
  };

  const toAdd = draft.filter((x) => !saved.includes(x));
  const toRemove = saved.filter((x) => !draft.includes(x));
  const dirty = toAdd.length + toRemove.length > 0;
  const title = (id: string) => noms.find((n) => n.id === id)?.title ?? "—";

  const send = async (id: string, on: boolean) => {
    const r = await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nominationId: id, on }),
    });
    return r.ok;
  };

  const confirm = async () => {
    setBusy(true);
    let current = [...saved];
    let fail = 0;
    // сначала снимаем лишние, потом добавляем новые (лимит 2 на сервере)
    for (const id of toRemove) {
      try { (await send(id, false)) ? (current = current.filter((x) => x !== id)) : fail++; } catch { fail++; }
    }
    for (const id of toAdd) {
      try { (await send(id, true)) ? current.push(id) : fail++; } catch { fail++; }
    }
    setSaved(current);
    setBusy(false);
    setReview(false);
    if (fail === 0) toast("Выбор подтверждён и сохранён");
    else toast("Не всё удалось сохранить, попробуйте ещё раз", "err");
  };

  return (
    <div className="pb-32">
      <div className="glass mb-6 rounded-card p-5">
        <p className="title text-2xl gold-text">Этап 1 из 2</p>
        <p className="mt-2 text-silver">
          Выберите <b>2 дополнительные номинации</b>, которые должны попасть в премию. Две самые популярные пройдут дальше, и тогда начнётся голосование за кандидатов.
          Выбрано: {draft.length} из 2.
        </p>
      </div>

      {saved.length > 0 && (
        <p className="glass mb-4 rounded-xl border-gold/40 p-4">
          Ваш сохранённый выбор: <b className="text-gold">{saved.map(title).join(", ")}</b>
          {open && <span className="block text-xs text-muted">Его можно изменить до закрытия голосования.</span>}
        </p>
      )}
      {!open && <p className="glass mb-4 rounded-xl p-4 text-center text-red-300">Голосование закрыто</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {noms.map((n) => {
          const sel = draft.includes(n.id);
          const isSaved = saved.includes(n.id);
          return (
            <button
              key={n.id}
              disabled={!open}
              onClick={() => toggle(n.id)}
              aria-pressed={sel}
              className={`glass min-h-[88px] rounded-card p-5 text-left transition hover:-translate-y-1 ${sel ? "border-gold shadow-gold" : "hover:shadow-glow"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="title text-2xl">{n.title}</h3>
                {sel && <Check className="text-gold" />}
              </div>
              <p className="mt-1 text-sm text-muted">{n.description}</p>
              {isSaved && <p className="mt-2 text-xs text-gold">сохранено</p>}
              {sel && !isSaved && <p className="mt-2 text-xs text-violet-glow">ждёт подтверждения</p>}
            </button>
          );
        })}
      </div>

      {logged && open && (
        <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-white/10 bg-graphite/95 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              Выбрано: <b className="text-gold">{draft.length}</b> из 2
              {dirty && <span className="text-muted"> · не подтверждено</span>}
            </p>
            <button className="btn" disabled={!dirty} onClick={() => setReview(true)}>
              ПРОВЕРИТЬ И ПОДТВЕРДИТЬ
            </button>
          </div>
        </div>
      )}

      {review && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/80 p-4" role="dialog" aria-modal>
          <div className="glass w-full max-w-lg rounded-card bg-graphite p-6">
            <h3 className="title
