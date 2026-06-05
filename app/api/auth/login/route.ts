import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { readDb } from "@/lib/db";
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

    const db = await readDb();
    const user = db.users.find(
      (u) => u.username === username.trim().toLowerCase()
    );

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Kullanıcı adı veya şifre hatalı" },
        { status: 401 }
      );
    }

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
  } catch {
    return NextResponse.json({ error: "Giriş başarısız" }, { status: 500 });
  }
}
