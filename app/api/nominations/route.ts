import { NextResponse } from "next/server"; import { getNominations } from "@/lib/data";
export async function GET() { try { return NextResponse.json({ nominations: await getNominations() }); } catch { return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 }); } }
