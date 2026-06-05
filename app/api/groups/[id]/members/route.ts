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
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Kullanıcı gerekli" }, { status: 400 });
  }

  const db = await readDb();
  const group = db.groups.find((g) => g.id === id);
  if (!group) {
    return NextResponse.json({ error: "Grup bulunamadı" }, { status: 404 });
  }

  if (!group.memberIds.includes(auth.userId)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const targetUser = db.users.find((u) => u.id === userId);
  if (!targetUser) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  if (group.memberIds.includes(userId)) {
    return NextResponse.json({ error: "Zaten grupta" }, { status: 409 });
  }

  // Check if invitation already exists
  const existingInv = db.invitations.find(
    (inv) => inv.groupId === id && inv.inviteeId === userId && inv.status === "pending"
  );
  if (existingInv) {
    return NextResponse.json({ error: "Davet zaten gönderildi" }, { status: 409 });
  }

  const { v4 as uuidv4 } = await import("uuid");

  db.invitations.push({
    id: uuidv4(),
    groupId: id,
    groupName: group.name,
    inviterId: auth.userId,
    inviterUsername: auth.username,
    inviteeId: userId,
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  await writeDb(db);

  return NextResponse.json({ message: "Davet gönderildi", success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
  }

  const { id } = await params;
  const { userId } = await req.json();

  const db = await readDb();
  const group = db.groups.find((g) => g.id === id);
  if (!group) {
    return NextResponse.json({ error: "Grup bulunamadı" }, { status: 404 });
  }

  if (group.ownerId !== auth.userId) {
    return NextResponse.json({ error: "Sadece grup sahibi çıkarabilir" }, { status: 403 });
  }

  if (userId === group.ownerId) {
    return NextResponse.json({ error: "Grup sahibi çıkarılamaz" }, { status: 400 });
  }

  group.memberIds = group.memberIds.filter((mid) => mid !== userId);
  await writeDb(db);

  return NextResponse.json({ success: true });
}
