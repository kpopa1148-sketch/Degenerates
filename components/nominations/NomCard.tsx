import Link from "next/link"; import type { Nomination } from "@/lib/data"; import { avatarUrl } from "@/lib/discord/avatar";
import { Crown, Skull, Ghost, Megaphone, Flame, Shuffle, Zap, Star, Mic, Briefcase, Bot, Shield } from "lucide-react";
const icons = [Crown, Skull, Zap, Ghost, Megaphone, Flame, Skull, Shuffle, Star, Zap, Shield, Briefcase, Bot, Shield, Mic, Star];
export default function NomCard({ n, i }: { n: Nomination; i: number }) {
  const Icon = icons[i % icons.length]; const main = n.type === "main";
  return (<article className={`group glass rounded-card p-6 transition hover:-translate-y-1 ${main ? "border-gold/40 hover:shadow-gold" : "hover:shadow-glow"}`}>
    <Icon className={main ? "text-gold" : "text-violet-glow"} size={main ? 44 : 34} />
    <h3 className={`title mt-3 ${main ? "text-3xl gold-text" : "text-2xl"}`}>{n.title}</h3><p className="mt-1 text-sm text-muted">{n.description}</p>
    <p className="mt-3 text-xs text-silver">Голосов: {n.total}</p>
    <div className="mt-3 flex -space-x-2">{n.candidates.length === 0 ? <span className="text-xs text-muted">Кандидатов пока нет</span> : n.candidates.slice(0, 6).map((c) => <img key={c.id} loading="lazy" src={avatarUrl(c.discord_id, c.avatar_hash, 64)} alt={c.username} title={c.username} className="h-9 w-9 rounded-full ring-2 ring-ink" />)}</div>
    <ul className="mt-2 text-xs text-muted">{n.candidates.slice(0, 3).map((c) => <li key={c.id}>{c.username}</li>)}</ul>
    <Link href={`/vote#${n.id}`} className="btn mt-4 text-sm">ГОЛОСОВАТЬ</Link></article>);
}
