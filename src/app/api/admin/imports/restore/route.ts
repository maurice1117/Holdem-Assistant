import { NextResponse } from "next/server";

import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import { restoreImportVersion } from "@/lib/import-repository";

export async function POST(request: Request) {
  if (!(await isAdminRequestAuthenticated())) return NextResponse.json({ error: "未登入。" }, { status: 401 });
  try {
    const { versionId } = await request.json() as { versionId?: unknown };
    if (typeof versionId !== "string") return NextResponse.json({ error: "缺少版本識別碼。" }, { status: 400 });
    await restoreImportVersion(versionId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "無法回復此版本。" }, { status: 400 });
  }
}
