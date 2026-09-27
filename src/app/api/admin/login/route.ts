import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, createAdminSession, verifySharedPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { password?: unknown };
    if (typeof body.password !== "string" || !(await verifySharedPassword(body.password))) {
      return NextResponse.json({ error: "密碼不正確。" }, { status: 401 });
    }

    const session = createAdminSession();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: session.maxAge,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "管理登入尚未完成設定。" }, { status: 503 });
  }
}
