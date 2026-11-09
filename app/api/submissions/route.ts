import { NextResponse } from "next/server"; import { getSession } from "@/lib/auth/session"; import { supabaseAdmin } from "@/lib/supabase/admin";
import { submissionSchema } from "@/lib/validation/schemas"; import { rateLimit } from "@/lib/rate-limit";
export async function POST(req: Request) {
  const s = await getSession(); if (!s) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  if (!rateLimit(`sub:${s.uid}`, 5)) return NextResponse.json({ error: "Слишком часто" }, { status: 429 });
  const p = submissionSchema.safeParse(await req.json().catch(() => null)); if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Некорректные данные" }, { status: 400 });
  const db = supabaseAdmin(); const d = p.data;
  const { data: dup } = await db.from("candidates").select("id").eq("nomination_id", d.nominationId).eq("discord_id", d.candidateDiscordId).maybeSingle();
  if (dup) return NextResponse.json({ error: "Этот кандидат уже есть в номинации" }, { status: 409 });
  const { error } = await db.from("candidate_submissions").insert({ submitted_by: s.uid, nomination_id: d.nominationId, candidate_discord_id: d.candidateDiscordId, candidate_name: d.candidateName, reason: d.reason });
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Такая заявка уже на модерации" : "Ошибка сервера" }, { status: error.code === "23505" ? 409 : 500 });
  await db.from("activity_logs").insert({ user_id: s.uid, action: "submission_created", entity_type: "nomination", entity_id: d.nominationId });
  return NextResponse.json({ ok: true });
}
