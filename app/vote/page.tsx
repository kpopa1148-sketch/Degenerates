import VoteBoard from "@/components/voting/VoteBoard"; import PickBoard from "@/components/voting/PickBoard";
import { getNominations, getSettings } from "@/lib/data"; import { getSession } from "@/lib/auth/session";
export const dynamic = "force-dynamic";
export default async function Page() {
  const [n, s, sess] = await Promise.all([getNominations(), getSettings(), getSession()]);
  const stage = s.stage ?? "candidates"; const open = !!s.voting_open;
  return <div className="mx-auto max-w-6xl px-4 py-12"><h1 className="title mb-4 text-4xl gold-text sm:text-6xl">Голосование</h1>
    {!sess && <p className="mb-6"><a className="btn" href="/auth/login">ВОЙТИ ЧЕРЕЗ DISCORD</a></p>}
    {stage === "nominations" ? <PickBoard noms={n.filter((x) => x.type === "additional")} open={open} logged={!!sess} />
      : <VoteBoard noms={n} open={open} logged={!!sess} />}</div>;
}
