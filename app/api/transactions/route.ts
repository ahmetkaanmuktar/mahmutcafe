import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getUserFromRequest } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";
import { getMenuItem } from "@/lib/menu";
import type { MenuItemId } from "@/lib/menu";

export async function GET(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
  }

  const groupId = req.nextUrl.searchParams.get("groupId");
  const personal = req.nextUrl.searchParams.get("personal") === "true";

  const db = await readDb();

  let transactions = db.transactions;

  if (personal) {
    transactions = transactions.filter(
      (t) => t.userId === auth.userId && t.groupId === null
    );
  } else if (groupId) {
    const group = db.groups.find((g) => g.id === groupId);
    if (!group || !group.memberIds.includes(auth.userId)) {
      return NextResponse.json({ error: "Gruba erişim yok" }, { status: 403 });
    }
    transactions = transactions.filter((t) => t.groupId === groupId);
  } else {
    transactions = transactions.filter((t) => t.userId === auth.userId);
  }

  const enriched = transactions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50)
    .map((t) => {
      const user = db.users.find((u) => u.id === t.userId);
      return {
        ...t,
        username: user?.username || "bilinmiyor",
      };
    });

  const total = transactions.reduce((sum, t) => sum + t.totalPrice, 0);

  return NextResponse.json({ transactions: enriched, total });
}

export async function POST(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
  }

  const body = await req.json();
  const { itemId, quantity, customPrice, accountType, groupId, note } = body;

  if (!itemId || !quantity || quantity < 1) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const menuItem = getMenuItem(itemId as MenuItemId);
  let unitPrice = menuItem.price;

  if (itemId === "ekstra") {
    if (!customPrice || customPrice <= 0) {
      return NextResponse.json({ error: "Ekstra için fiyat girin" }, { status: 400 });
    }
    unitPrice = customPrice;
  }

  if (unitPrice === null) {
    return NextResponse.json({ error: "Fiyat belirlenemedi" }, { status: 400 });
  }

  const db = await readDb();
  let targetGroupId: string | null = null;

  if (accountType === "group") {
    if (!groupId) {
      return NextResponse.json({ error: "Grup seçin" }, { status: 400 });
    }
    const group = db.groups.find((g) => g.id === groupId);
    if (!group || !group.memberIds.includes(auth.userId)) {
      return NextResponse.json({ error: "Gruba erişim yok" }, { status: 403 });
    }
    targetGroupId = groupId;
  }

  const transaction = {
    id: uuidv4(),
    userId: auth.userId,
    groupId: targetGroupId,
    itemId: itemId as MenuItemId,
    itemName: menuItem.name,
    quantity: Number(quantity),
    unitPrice,
    totalPrice: unitPrice * Number(quantity),
    note: note?.trim() || "",
    createdAt: new Date().toISOString(),
  };

  db.transactions.push(transaction);
  await writeDb(db);

  return NextResponse.json({
    transaction: {
      ...transaction,
      username: auth.username,
    },
  });
}

export async function DELETE(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
  }

  const { transactionId } = await req.json();
  const db = await readDb();
  const tx = db.transactions.find((t) => t.id === transactionId);

  if (!tx) {
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  }

  if (tx.userId !== auth.userId) {
    return NextResponse.json({ error: "Sadece kendi kaydınızı silebilirsiniz" }, { status: 403 });
  }

  db.transactions = db.transactions.filter((t) => t.id !== transactionId);
  await writeDb(db);

  return NextResponse.json({ success: true });
}
