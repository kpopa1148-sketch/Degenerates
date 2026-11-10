import { redirect } from "next/navigation"; import { getSession, isAdmin } from "@/lib/auth/session"; import { getNominations, getSettings } from "@/lib/data";
import AdminPanel from "@/components/admin/AdminPanel"; import StageControl from "@/components/admin/StageControl";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!isAdmin(await getSession())) redirect("/?denied=1");
  const [n, s] = await Promise.all([getNominations(true), getSettings()]);
  return <div className="mx-auto max-w-6xl px-4 py-12"><h1 className="title mb-6 text-3xl gold-text sm:text-5xl">Админ-панель</h1><StageControl /><AdminPanel noms={n} settings={s} /></div>;
}
