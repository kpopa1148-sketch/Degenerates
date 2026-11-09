import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";
// POST + проверка Origin — защита от CSRF
export async function POST(req: Request) {
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  if (req.headers.get("origin") !== new URL(site).origin) return new NextResponse("Bad origin", { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
