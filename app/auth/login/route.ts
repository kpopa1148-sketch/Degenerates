import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { authorizeUrl } from "@/lib/discord/oauth";
import { cookieOpts } from "@/lib/auth/session";

export async function GET() {
  const state = randomBytes(24).toString("hex");
  const res = NextResponse.redirect(authorizeUrl(state));
  res.cookies.set("da_state", state, cookieOpts(600));
  return res;
}
