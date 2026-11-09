import VoteBoard from "@/components/voting/VoteBoard"; import { getNominations, getSettings } from "@/lib/data"; import { getSession } from "@/lib/auth/session";
export const dynamic = "force-dynamic";
export default async function Page() {
  const [n, s, sess] = await Promise.all([getNominations(), getSettings(), getSession()]);
  return <div className="mx-auto max-w-6xl px-4 py-12"><h1 className="title mb-4 text-6xl gold-text">Голосование</h1>
    {!sess && <p className="mb-6"><a className="btn" href="/auth/login">ВОЙТИ ЧЕРЕЗ DISCORD</a></p>}<VoteBoard noms={n} open={!!s.voting_open} logged={!!sess} /></div>;
}
