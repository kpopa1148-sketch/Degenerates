import "./globals.css"; import type { Metadata } from "next"; import Nav from "@/components/layout/Nav"; import Toaster from "@/components/ui/Toaster"; import Link from "next/link";
import { getSettings } from "@/lib/data"; import { getSession, isAdmin } from "@/lib/auth/session";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "DEGENERATES AWARDS", description: "Самая сомнительная премия твоего Discord-сервера" };
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let maintenance = false;
  try { maintenance = !!(await getSettings()).site_maintenance && !isAdmin(await getSession()); } catch {}
  return (<html lang="ru"><body><Nav />
    <main>{maintenance ? <div className="p-24 text-center"><h1 className="title text-6xl gold-text">Технические работы</h1><p className="mt-4 text-muted">Скоро вернёмся.</p></div> : children}</main>
    <Toaster />
    <footer className="mt-24 border-t border-white/10 px-4 py-10 text-center text-sm text-muted">
      <p className="title text-2xl gold-text">Degenerates Awards</p>
      <p className="mt-3 flex justify-center gap-5">{[["/", "Главная"], ["/nominations", "Номинации"], ["/vote", "Голосование"], ["/results", "Результаты"]].map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}</p>
      <p className="mt-3">Ежегодная премия Discord-сервера. Не для слабонервных.</p></footer></body></html>);
}
