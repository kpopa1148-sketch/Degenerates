import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { voteSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/rate-limit";

const MSG: Record<string, [string, number]> = {
  VOTING_CLOSED: ["Голосование закрыто", 403], NOMINATION_INACTIVE: ["Номинация недоступна", 400],
  BAD_CANDIDATE: ["Кандидат не относится к номинации", 400],
};

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Требуется вход через Discord" }, { status: 401 });
  if (!rateLimit(`vote:${s.uid}`)) return NextResponse.json({ error: "Слишком часто" }, { status: 429 });
  if (Number(req.headers.get("content-length") ?? 0) > 2048) return NextResponse.json({ error: "Слишком большой запрос" }, { status: 413 });
  const body = voteSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  // user_id берётся ТОЛЬКО из подписанной сессии, не из тела запроса
  const { data, error } = await supabaseAdmin().rpc("cast_vote", {
    p_user_id: s.uid, p_nomination_id: body.data.nominationId, p_candidate_id: body.data.candidateId,
  });
  if (error) {
    const hit = Object.keys(MSG).find((k) => error.message.includes(k));
    return NextResponse.json({ error: hit ? MSG[hit][0] : "Ошибка сервера" }, { status: hit ? MSG[hit][1] : 500 });
  }
  return NextResponse.json({ ok: true, changed: data.changed });
}

// мои голоса (для восстановления состояния после перезагрузки)
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin().from("votes").select("nomination_id,candidate_id").eq("user_id", s.uid);
  if (error) return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  return NextResponse.json({ votes: data });
}
