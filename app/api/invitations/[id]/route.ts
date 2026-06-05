import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await req.json(); // "accept" or "reject"

  if (action !== "accept" && action !== "reject") {
    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  }

  const db = await readDb();
  const invitation = db.invitations.find((inv) => inv.id === id);

  if (!invitation) {
    return NextResponse.json({ error: "Davet bulunamadı" }, { status: 404 });
  }

  if (invitation.inviteeId !== auth.userId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  if (invitation.status !== "pending") {
    return NextResponse.json({ error: "Bu davet zaten işlenmiş" }, { status: 400 });
  }

  invitation.status = action === "accept" ? "accepted" : "rejected";

  if (action === "accept") {
    const group = db.groups.find((g) => g.id === invitation.groupId);
    if (group && !group.memberIds.includes(auth.userId)) {
      group.memberIds.push(auth.userId);
    }
  }

  await writeDb(db);

  return NextResponse.json({ success: true, status: invitation.status });
}
