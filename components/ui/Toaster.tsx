"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
type T = { id: number; msg: string; kind: "ok" | "err" };
export const toast = (msg: string, kind: "ok" | "err" = "ok") =>
  typeof window !== "undefined" && window.dispatchEvent(new CustomEvent("da-toast", { detail: { msg, kind } }));
export default function Toaster() {
  const [items, set] = useState<T[]>([]);
  useEffect(() => {
    const h = (e: Event) => { const d = (e as CustomEvent).detail; const id = Date.now() + Math.random();
      set((a) => [...a, { id, ...d }]); setTimeout(() => set((a) => a.filter((x) => x.id !== id)), 4000); };
    window.addEventListener("da-toast", h); return () => window.removeEventListener("da-toast", h);
  }, []);
  return (<div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2" role="status" aria-live="polite">
    <AnimatePresence>{items.map((t) => (<motion.div key={t.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
      className={`glass rounded-xl px-4 py-3 text-sm font-semibold ${t.kind === "ok" ? "border-gold/50" : "border-red-500/60"}`}>{t.msg}</motion.div>))}</AnimatePresence></div>);
}
