import { NextResponse } from "next/server"; import { supabaseAdmin } from "@/lib/supabase/admin"; import { getSession, isAdmin } from "@/lib/auth/session";
export async function GET() {
  const { data, error } = await supabaseAdmin().rpc("get_results", { p_is_admin: isAdmin(await getSession()) });
  if (error) return error.message.includes("RESULTS_HIDDEN") ? NextResponse.json({ error: "Результаты пока скрыты" }, { status: 403 }) : NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  return NextResponse.json({ results: data });
}
