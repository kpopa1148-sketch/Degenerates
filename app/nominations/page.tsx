import NomCard from "@/components/nominations/NomCard"; import { getNominations } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function Page() {
  const noms = await getNominations(); const sec = (t: "main" | "additional", h: string) => { const l = noms.filter((n) => n.type === t); return (<section className="mb-16"><h2 className="title mb-6 text-4xl">{h}</h2>
    {l.length ? <div className={`grid gap-5 ${t === "main" ? "md:grid-cols-2" : "md:grid-cols-3"}`}>{l.map((n, i) => <NomCard key={n.id} n={n} i={noms.indexOf(n)} />)}</div> : <p className="text-muted">Номинаций пока нет</p>}</section>); };
  return <div className="mx-auto max-w-7xl px-4 py-12"><h1 className="title mb-10 text-6xl gold-text">Номинации</h1>{sec("main", "Основные")}{sec("additional", "Дополнительные")}</div>;
}
