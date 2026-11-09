import { redirect } from "next/navigation"; import { getSession, isAdmin } from "@/lib/auth/session"; import { getNominations, getSettings } from "@/lib/data"; import AdminPanel from "@/components/admin/AdminPanel";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!isAdmin(await getSession())) redirect("/?denied=1"); // серверная проверка
  const [n, s] = await Promise.all([getNominations(true), getSettings()]);
  return <div className="mx-auto max-w-6xl px-4 py-12"><h1 className="title mb-6 text-5xl gold-text">Админ-панель</h1><AdminPanel noms={n} settings={s} /></div>;
}
