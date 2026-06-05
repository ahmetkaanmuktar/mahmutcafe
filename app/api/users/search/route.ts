import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() || "";
  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const db = await readDb();
  const users = db.users
    .filter((u) => u.id !== auth.userId && u.username.includes(q))
    .slice(0, 10)
    .map((u) => ({ id: u.id, username: u.username }));

  return NextResponse.json({ users });
}
