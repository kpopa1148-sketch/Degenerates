"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus } from "lucide-react";
import type { Nomination } from "@/lib/data";
import { avatarUrl } from "@/lib/discord/avatar";
import { toast } from "@/components/ui/Toaster";

export default function VoteBoard({ noms, open, logged }: { noms: Nomination[]; open: boolean; logged: boolean }) {
  const [mine, setMine] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [review, setReview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sug, setSug] = useState<string | null>(null);

  useEffect(() => {
    if (!logged) return;
    fetch("/api/votes")
      .then((r) => r.json())
      .then((d) => {
        const m = Object.fromEntries((d.votes ?? []).map((v: any) => [v.nomination_id, v.candidate_id]));
        setMine(m);
        setDraft(m);
      })
      .catch(() => toast("Не удалось загрузить ваши голоса", "err"));
  }, [logged]);

  const nameOf = (nid: string, cid?: string) =>
    noms.find((n) => n.id === nid)?.candidates.find((c) => c.id === cid)?.username;

  const dirty = useMemo(() => noms.filter((n) => draft[n.id] && draft[n.id] !== mine[n.id]), [noms, draft, mine]);
  const chosen = noms.filter((n) => draft[n.id]).length;

  const pick = (nid: string, cid: string) => {
    if (!logged) return toast("Сначала войдите через Discord", "err");
    if (!open) return toast("Голосование закрыто", "err");
    setDraft((d) => ({ ...d, [nid]: cid }));
  };

  const confirm = async () => {
    setSaving(true);
    let ok = 0;
    let fail = 0;
    const saved = { ...mine };
    for (const n of dirty) {
      try {
        const r = await fetch("/api/votes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nominationId: n.id, candidateId: draft[n.id] }),
        });
        if (r.ok) { saved[n.id] = draft[n.id]; ok++; } else fail++;
      } catch { fail++; }
    }
    setMine(saved);
    setSaving(false);
    setReview(false);
    if (fail === 0) toast(ok ? "Голоса подтверждены и сохранены" : "Изменений нет");
    else toast(`Сохранено: ${ok}, ошибок: ${fail}. Попробуйте ещё раз`, "err");
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nominationId: sug, candidateDiscordId: f.get("id"), candidateName: f.get("name"), reason: f.get("reason") }),
    });
    const d = await r.json();
    if (r.ok) { toast("Предложение отправлено"); setSug(null); } else toast(d.error ?? "Ошибка", "err");
  };

  const savedList = noms.filter((n) => mine[n.id]);

  return (
    <div className="space-y-10 pb-32">
      {!open && <p className="glass rounded-xl p-4 text-center text-red-300">Голосование закрыто</p>}

      {savedList.length > 0 && (
        <section className="glass rounded-card border-gold/40 p-5" aria-label="Ваш выбор">
          <h2 className="title text-2xl gold-text">Ваш выбор сохранён ({savedList.length} из {noms.length})</h2>
          <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
            {savedList.map((n) => (
              <li key={n.id} className="flex justify-between gap-3 border-b border-white/5 py-1">
                <span className="text-muted">{n.title}</span>
                <b>{nameOf(n.id, mine[n.id])}</b>
              </li>
            ))}
          </ul>
          {open && <p className="mt-3 text-xs text-muted">Вы можете изменить выбор до закрытия голосования.</p>}
        </section>
      )}

      {noms.map((n) => (
        <section key={n.id} id={n.id} className="glass scroll-mt-24 rounded-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className={`title text-3xl ${n.type === "main" ? "gold-text" : ""}`}>{n.title}</h2>
            <span className="text-xs text-muted">{n.total} голосов</span>
          </div>
          <p className="text-sm text-muted">{n.description}</p>
          {n.candidates.length === 0 ? (
            <p className="mt-4 text-muted">Кандидатов пока нет — предложите первого.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {n.candidates.map((c) => {
                const sel = draft[n.id] === c.id;
                const saved = mine[n.id] === c.id;
                return (
                  <motion.button
                    key={c.id}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={!open}
                    onClick={() => pick(n.id, c.id)}
                    aria-pressed={sel}
                    className={`flex min-h-[64px] items-center gap-3 rounded-xl border p-3 text-left transition ${sel ? "border-gold bg-gold/10 shadow-gold" : "border-white/10 hover:border-violet"}`}
                  >
                    <img loading="lazy" src={avatarUrl(c.discord_id, c.avatar_hash, 64)} alt="" className="h-12 w-12 rounded-full" />
                    <span className="flex-1 font-semibold">
                      {c.username}
                      {saved && <span className="block text-xs font-normal text-gold">сохранён</span>}
                      {sel && !saved && <span className="block text-xs font-normal text-violet-glow">ждёт подтверждения</span>}
                    </span>
                    <AnimatePresence>
                      {sel && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-gold">
                          <Check />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          )}
          {logged && (
            <button className="mt-4 flex items-center gap-1 text-sm text-violet-glow" onClick={() => setSug(n.id)}>
              <Plus size={14} />Предложить кандидата
            </button>
          )}
        </section>
      ))}

      {logged && open && (
        <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-white/10 bg-graphite/95 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              Выбрано: <b className="text-gold">{chosen}</b> из {noms.length}
              {dirty.length > 0 && <span className="text-muted"> · не подтверждено: {dirty.length}</span>}
            </p>
            <button className="btn" disabled={dirty.length === 0} onClick={() => setReview(true)}>
              ПРОВЕРИТЬ И ПОДТВЕРДИТЬ
            </button>
          </div>
        </div>
      )}

      {review && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/80 p-4" role="dialog" aria-modal>
          <div className="glass max-h-[90vh] w-full max-w-lg overflow-auto rounded-card bg-graphite p-6">
            <h3 className="title text-3xl gold-text">Ваш выбор</h3>
            <p className="mt-1 text-sm text-muted">Проверьте и подтвердите. Позже голоса можно будет изменить, пока голосование открыто.</p>
            <ul className="mt-4 space-y-2 text-sm">
              {noms.map((n) => (
                <li key={n.id} className="flex justify-between gap-3 border-b border-white/5 pb-1">
                  <span className="text-muted">{n.title}</span>
                  {draft[n.id] ? <b>{nameOf(n.id, draft[n.id])}</b> : <span className="text-red-300">не выбрано</span>}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-2">
              <button className="btn" disabled={saving} onClick={confirm}>{saving ? "Сохраняем…" : "ПОДТВЕРДИТЬ ГОЛОСА"}</button>
              <button className="btn btn-ghost" disabled={saving} onClick={() => setReview(false)}>Назад</button>
            </div>
          </div>
        </div>
      )}

      {sug && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal>
          <form onSubmit={submit} className="glass w-full max-w-md space-y-3 rounded-card bg-graphite p-6">
            <h3 className="title text-2xl">Предложить кандидата</h3>
            <input name="id" required pattern="\d{15,22}" placeholder="Discord User ID" className="w-full rounded-lg bg-black/40 p-3" />
            <input name="name" required minLength={2} maxLength={64} placeholder="Имя кандидата" className="w-full rounded-lg bg-black/40 p-3" />
            <textarea name="reason" required minLength={10} maxLength={500} placeholder="Почему он достоин?" className="w-full rounded-lg bg-black/40 p-3" rows={3} />
            <div className="flex gap-2">
              <button className="btn">Отправить</button>
              <button type="button" className="btn btn-ghost" onClick={() => setSug(null)}>Отмена</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
