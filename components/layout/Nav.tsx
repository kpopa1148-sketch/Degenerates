"use client";
import Link from "next/link"; import { useEffect, useState } from "react"; import { Menu, X, LogOut, Shield } from "lucide-react";
import { toast } from "@/components/ui/Toaster";
type U = { username: string; global_name: string | null; avatarUrl: string; isAdmin: boolean };
const links = [["/", "Главная"], ["/nominations", "Номинации"], ["/vote", "Голосование"], ["/results", "Результаты"]];
export default function Nav() {
  const [u, setU] = useState<U | null>(null); const [open, setOpen] = useState(false); const [menu, setMenu] = useState(false);
  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setU(d.user)).catch(() => {});
    const a = new URLSearchParams(location.search).get("auth");
    if (a) { a === "ok" ? toast("Вы успешно вошли") : toast("Ошибка авторизации", "err"); history.replaceState({}, "", location.pathname); }
    if (new URLSearchParams(location.search).get("denied")) toast("Нет доступа к странице", "err");
  }, []);
  const logout = async () => { await fetch("/auth/logout", { method: "POST" }); setU(null); toast("Вы вышли из аккаунта"); };
  const Login = <a href="/auth/login" className="btn text-sm">ВОЙТИ ЧЕРЕЗ DISCORD</a>;
  return (<header className="sticky top-0 z-50 glass"><nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3" aria-label="Главная навигация">
    <Link href="/" className="title text-xl gold-text">Degenerates Awards</Link>
    <ul className="hidden gap-6 md:flex">{links.map(([h, l]) => <li key={h}><Link href={h} className="text-sm text-silver hover:text-white">{l}</Link></li>)}</ul>
    <div className="hidden md:block relative">{u ? (<><button onClick={() => setMenu(!menu)} className="flex items-center gap-2" aria-haspopup="menu" aria-expanded={menu}>
      <img src={u.avatarUrl} alt="" className="h-9 w-9 rounded-full ring-2 ring-violet" /><span className="text-sm">{u.global_name ?? u.username}</span></button>
      {menu && <div className="glass absolute right-0 mt-2 w-48 rounded-xl p-2 bg-graphite" role="menu">
        {u.isAdmin && <Link href="/admin" className="flex gap-2 p-2 text-sm hover:text-gold"><Shield size={16} />Админ-панель</Link>}
        <button onClick={logout} className="flex w-full gap-2 p-2 text-sm hover:text-gold"><LogOut size={16} />Выйти</button></div>}</>) : Login}</div>
    <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Меню">{open ? <X /> : <Menu />}</button></nav>
    {open && <div className="md:hidden flex flex-col gap-3 bg-graphite p-4">{links.map(([h, l]) => <Link key={h} href={h} onClick={() => setOpen(false)}>{l}</Link>)}
      {u ? <><span className="flex items-center gap-2"><img src={u.avatarUrl} alt="" className="h-8 w-8 rounded-full" />{u.username}</span>
        {u.isAdmin && <Link href="/admin">Админ-панель</Link>}<button onClick={logout} className="text-left">Выйти</button></> : Login}</div>}</header>);
}
