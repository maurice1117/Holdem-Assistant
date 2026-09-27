import { NextResponse } from "next/server";

import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import { createImportVersion, listImportVersions } from "@/lib/import-repository";
import { parseSessionResultsWorkbook } from "@/lib/workbook-import";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export async function GET() {
  if (!(await isAdminRequestAuthenticated())) return NextResponse.json({ error: "未登入。" }, { status: 401 });
  try {
    return NextResponse.json({ versions: await listImportVersions() });
  } catch {
    return NextResponse.json({ error: "無法讀取版本紀錄，請確認 Supabase 設定。" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequestAuthenticated())) return NextResponse.json({ error: "未登入。" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json({ error: "請選擇 .xlsx 格式的 Excel 檔。" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Excel 檔案不可超過 10 MB。" }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const result = parseSessionResultsWorkbook(fileBuffer);
    if (result.errors.length > 0) return NextResponse.json(result, { status: 422 });

    const version = await createImportVersion({
      file: fileBuffer,
      fileName: file.name,
      records: result.records,
      summary: result.summary,
    });
    return NextResponse.json({ version, summary: result.summary }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "無法解析或保存 Excel 檔。" }, { status: 400 });
  }
}
