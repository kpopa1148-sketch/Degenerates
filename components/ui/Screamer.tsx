"use client";
import { useEffect, useRef, useState } from "react";

function scream() {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AC();
    const g = ctx.createGain();
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.2, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    g.connect(ctx.destination);
    [440, 466, 880].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 2 ? "square" : "sawtooth";
      o.frequency.setValueAtTime(f, now);
      o.frequency.exponentialRampToValueAtTime(f * 2.2, now + 0.4);
      o.frequency.exponentialRampToValueAtTime(f * 0.8, now + 1.4);
      o.connect(g);
      o.start(now);
      o.stop(now + 1.5);
    });
    setTimeout(() => ctx.close(), 2000);
  } catch {}
}

export default function Screamer() {
  const [show, setShow] = useState(false);
  const count = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest("header a.gold-text")) return;
      count.current += 1;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => (count.current = 0), 3000);
      if (count.current >= 10) {
        count.current = 0;
        setShow(true);
        scream();
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShow(false);
    document.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 3500);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;
  return (
    <div
      onClick={() => setShow(false)}
      role="dialog"
      aria-label="Пасхалка"
      className="fixed inset-0 z-[200] grid place-items-center bg-black"
    >
      <svg viewBox="0 0 400 520" className="scare h-[90vh] max-w-full">
        <ellipse cx="200" cy="250" rx="150" ry="210" fill="#cfc9b8" stroke="#000" strokeWidth="6" />
        <ellipse cx="140" cy="205" rx="50" ry="66" fill="#000" transform="rotate(-12 140 205)" />
        <ellipse cx="260" cy="205" rx="50" ry="66" fill="#000" transform="rotate(12 260 205)" />
        <circle cx="146" cy="212" r="6" fill="#fff" />
        <circle cx="254" cy="212" r="6" fill="#fff" />
        <path d="M80 140 L175 175" stroke="#000" strokeWidth="14" strokeLinecap="round" />
        <path d="M320 140 L225 175" stroke="#000" strokeWidth="14" strokeLinecap="round" />
        <ellipse cx="188" cy="300" rx="7" ry="12" fill="#222" />
        <ellipse cx="212" cy="300" rx="7" ry="12" fill="#222" />
        <ellipse cx="200" cy="400" rx="112" ry="85" fill="#000" />
        <path d="M105 352 L120 396 L135 356 L152 402 L168 358 L185 406 L200 360 L215 406 L232 358 L248 402 L265 356 L280 396 L295 352 Z" fill="#e8e8d8" />
        <path d="M120 455 L135 412 L152 460 L168 416 L185 464 L200 418 L215 464 L232 416 L248 460 L265 412 L280 455 Z" fill="#e8e8d8" />
        <text x="200" y="508" textAnchor="middle" fontSize="14" fill="#8a8d98">
          Пасхалка найдена. Нажмите, чтобы закрыть
        </text>
      </svg>
    </div>
  );
}
