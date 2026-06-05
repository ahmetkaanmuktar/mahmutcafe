import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
  }

  const db = await readDb();

  const pendingInvitations = db.invitations.filter(
    (inv) => inv.inviteeId === auth.userId && inv.status === "pending"
  );

  return NextResponse.json({ invitations: pendingInvitations });
}
