import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "da_session";
const TTL = 60 * 60 * 24 * 7;
const secret = () => {
  const s = process.env.VOTING_SECRET;
  if (!s || s.length < 32) throw new Error("VOTING_SECRET must be >= 32 chars");
  return s;
};
export type Session = { uid: string; did: string; exp: number };

const sign = (p: string) => createHmac("sha256", secret()).update(p).digest("base64url");

export function createSessionToken(uid: string, did: string) {
  const payload = Buffer.from(JSON.stringify({ uid, did, exp: Date.now() + TTL * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
export function readSessionToken(t?: string): Session | null {
  if (!t) return null;
  const [p, s] = t.split(".");
  if (!p || !s) return null;
  const a = Buffer.from(s), b = Buffer.from(sign(p));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const d = JSON.parse(Buffer.from(p, "base64url").toString()) as Session;
    return d.exp > Date.now() ? d : null;
  } catch { return null; }
}
export const cookieOpts = (maxAge = TTL) => ({
  httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge,
});
export async function getSession() { return readSessionToken(cookies().get(SESSION_COOKIE)?.value); }
export const isAdmin = (s: Session | null) => !!s && s.did === process.env.ADMIN_DISCORD_ID;
export async function requireAdmin() {
  const s = await getSession();
  if (!isAdmin(s)) throw new Response("Forbidden", { status: 403 });
  return s!;
}
