import { NextResponse } from "next/server"; import { z } from "zod";
import { getSession } from "@/lib/auth/session"; import { supabaseAdmin } from "@/lib/supabase/admin"; import { rateLimit } from "@/lib/rate-limit";
export const dynamic = "force-dynamic";
const schema = z.object({ nominationId: z.string().uuid(), on: z.boolean() }).strict();
const MSG: Record<string, [string, number]> = {
  VOTING_CLOSED: ["Голосование закрыто", 403], WRONG_STAGE: ["Этап выбора номинаций уже завершён", 403],
  BAD_NOMINATION: ["Эта номинация недоступна для выбора", 400], PICK_LIMIT: ["Можно выбрать только 2 номинации", 400],
};
export async function GET() {
  const s = await getSession(); if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin().from("nomination_picks").select("nomination_id").eq("user_id", s.uid);
  if (error) return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  return NextResponse.json({ picks: (data ?? []).map((r) => r.nomination_id) });
}
export async function POST(req: Request) {
  const s = await getSession(); if (!s) return NextResponse.json({ error: "Требуется вход через Discord" }, { status: 401 });
  if (!rateLimit(`pick:${s.uid}`, 40)) return NextResponse.json({ error: "Слишком часто" }, { status: 429 });
  const p = schema.safeParse(await req.json().catch(() => null)); if (!p.success) return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  const { error } = await supabaseAdmin().rpc("cast_nomination_pick", { p_user_id: s.uid, p_nomination_id: p.data.nominationId, p_on: p.data.on });
  if (error) { const k = Object.keys(MSG).find((x) => error.message.includes(x)); return NextResponse.json({ error: k ? MSG[k][0] : "Ошибка сервера" }, { status: k ? MSG[k][1] : 500 }); }
  return NextResponse.json({ ok: true });
}
