import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { readDb, writeDb } from "@/lib/db";
import { createToken, TOKEN_MAX_AGE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Kullanıcı adı ve şifre gerekli" },
        { status: 400 }
      );
    }

    const trimmed = username.trim().toLowerCase();
    if (trimmed.length < 3) {
      return NextResponse.json(
        { error: "Kullanıcı adı en az 3 karakter olmalı" },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "Şifre en az 4 karakter olmalı" },
        { status: 400 }
      );
    }

    const db = await readDb();
    if (db.users.some((u) => u.username === trimmed)) {
      return NextResponse.json(
        { error: "Bu kullanıcı adı zaten alınmış" },
        { status: 409 }
      );
    }

    const user = {
      id: uuidv4(),
      username: trimmed,
      passwordHash: await bcrypt.hash(password, 10),
      createdAt: new Date().toISOString(),
    };

    db.users.push(user);
    await writeDb(db);

    const token = await createToken({ userId: user.id, username: user.username });

    const res = NextResponse.json({
      token,
      user: { id: user.id, username: user.username },
    });

    res.cookies.set("mahmud_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: TOKEN_MAX_AGE,
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Kayıt başarısız", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
