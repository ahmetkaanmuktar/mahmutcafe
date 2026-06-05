import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getUserFromRequest } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
  }

  const db = await readDb();
  const groups = db.groups
    .filter((g) => g.memberIds.includes(auth.userId))
    .map((g) => {
      const members = g.memberIds
        .map((id) => db.users.find((u) => u.id === id))
        .filter(Boolean)
        .map((u) => ({ id: u!.id, username: u!.username }));

      const groupTotal = db.transactions
        .filter((t) => t.groupId === g.id)
        .reduce((sum, t) => sum + t.totalPrice, 0);

      return {
        id: g.id,
        name: g.name,
        ownerId: g.ownerId,
        members,
        totalDebt: groupTotal,
        isOwner: g.ownerId === auth.userId,
      };
    });

  return NextResponse.json({ groups });
}

export async function POST(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Grup adı gerekli" }, { status: 400 });
  }

  const db = await readDb();
  const group = {
    id: uuidv4(),
    name: name.trim(),
    ownerId: auth.userId,
    memberIds: [auth.userId],
    createdAt: new Date().toISOString(),
  };

  db.groups.push(group);
  await writeDb(db);

  return NextResponse.json({
    group: {
      id: group.id,
      name: group.name,
      ownerId: group.ownerId,
      members: [{ id: auth.userId, username: auth.username }],
      totalDebt: 0,
      isOwner: true,
    },
  });
}
