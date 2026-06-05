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

  group.memberIds.push(userId);
  await writeDb(db);

  const members = group.memberIds
    .map((mid) => db.users.find((u) => u.id === mid))
    .filter(Boolean)
    .map((u) => ({ id: u!.id, username: u!.username }));

  return NextResponse.json({ members });
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
