import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
  }

  const { groupId, personal } = await req.json();
  const db = await readDb();

  if (personal) {
    // Delete all personal transactions of this user
    db.transactions = db.transactions.filter(
      (t) => !(t.userId === auth.userId && t.groupId === null)
    );
  } else if (groupId) {
    const group = db.groups.find((g) => g.id === groupId);
    if (!group || !group.memberIds.includes(auth.userId)) {
      return NextResponse.json({ error: "Gruba erişim yok" }, { status: 403 });
    }
    // Delete all transactions of this group
    db.transactions = db.transactions.filter((t) => t.groupId !== groupId);
  } else {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  await writeDb(db);
  return NextResponse.json({ success: true });
}
