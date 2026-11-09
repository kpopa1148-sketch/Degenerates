import Link from "next/link"; import Hero from "@/components/home/Hero"; import Faq from "@/components/home/Faq"; import { getSettings, getStats, getNominations } from "@/lib/data";
export const dynamic = "force-dynamic";
const H = ({ children }: { children: React.ReactNode }) => <h2 className="title mb-8 text-center text-4xl md:text-6xl">{children}</h2>;
export default async function Home() {
  const [s, st, noms] = await Promise.all([getSettings(), getStats(), getNominations()]);
  const steps = ["Войдите через Discord", "Выберите кандидата в каждой номинации", "Меняйте голос до закрытия", "Смотрите церемонию"];
  const rules = ["Голосовать могут авторизованные пользователи Discord.", "Один голос в номинации; его можно изменить до закрытия.", "Побеждает кандидат с наибольшим числом голосов.", "Предложенные кандидаты проходят модерацию администратором.", "Голосование закрывается автоматически в назначенное время.", "Спорные ситуации решает администратор сервера."];
  return (<>
    <Hero open={!!s.voting_open} endsAt={s.voting_ends_at} />
    <section className="mx-auto max-w-5xl px-4 py-24 text-center"><p className="title text-4xl md:text-7xl">Один сервер. Десятки легенд. <span className="gold-text">Шестнадцать способов опозориться.</span></p>
      <p className="mx-auto mt-6 max-w-2xl text-muted">Ежегодная премия для тех, кто делает наш Discord таким, какой он есть. Выбирайте лучших из худших.</p></section>
    <section className="mx-auto max-w-7xl px-4"><H>Избранные номинации</H><div className="grid gap-4 md:grid-cols-3">{noms.filter((n) => n.type === "main").slice(0, 3).map((n) => <div key={n.id} className="glass rounded-card p-6"><h3 className="title text-2xl gold-text">{n.title}</h3><p className="mt-2 text-muted">{n.description}</p></div>)}</div>
      <div className="mt-6 text-center"><Link href="/nominations" className="btn btn-ghost">Все номинации</Link></div></section>
    <section className="mx-auto mt-24 max-w-7xl px-4"><H>Как проходит голосование</H><ol className="grid gap-4 md:grid-cols-4">{steps.map((t, i) => <li key={t} className="glass rounded-card p-6"><span className="title text-5xl text-violet">{i + 1}</span><p className="mt-2">{t}</p></li>)}</ol></section>
    <section className="mx-auto mt-24 max-w-5xl px-4"><H>Статистика</H><div className="grid gap-4 md:grid-cols-4">{[["Участников", st.users], ["Голосов", st.votes], ["Кандидатов", st.candidates], ["Номинаций", noms.length]].map(([l, v]) => <div key={l as string} className="glass rounded-card p-6 text-center"><div className="title text-5xl gold-text">{v}</div><div className="text-muted">{l}</div></div>)}</div></section>
    <section className="mx-auto mt-24 max-w-3xl px-4 text-center"><H>Прими участие</H><Link href="/vote" className="btn">ГОЛОСОВАТЬ</Link></section>
    <section className="mt-24 px-4"><H>FAQ</H><Faq /></section>
    <section className="mx-auto mt-24 max-w-3xl px-4"><H>Правила</H><ul className="list-disc space-y-2 pl-6 text-silver">{rules.map((r) => <li key={r}>{r}</li>)}</ul></section></>);
}
