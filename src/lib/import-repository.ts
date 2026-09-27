import "server-only";

import { randomUUID } from "node:crypto";

import { getSupabaseAdmin } from "./supabase";
import type { ImportedSessionResult, WorkbookImportSummary } from "./workbook-import";

export interface ImportVersion {
  id: string;
  created_at: string;
  published_at: string | null;
  status: "pending" | "published" | "superseded";
  original_file_name: string | null;
  record_count: number;
  warning_count: number;
  summary: WorkbookImportSummary;
  source_version_id: string | null;
}

export async function createImportVersion(args: {
  file: Buffer;
  fileName: string;
  records: ImportedSessionResult[];
  summary: WorkbookImportSummary;
}): Promise<ImportVersion> {
  const supabase = getSupabaseAdmin();
  const id = randomUUID();
  const objectPath = `imports/${id}/${args.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error: uploadError } = await supabase.storage.from("session-imports").upload(objectPath, args.file, {
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: version, error: versionError } = await supabase
    .from("import_versions")
    .insert({
      id,
      status: "pending",
      original_file_path: objectPath,
      original_file_name: args.fileName,
      record_count: args.summary.recordCount,
      warning_count: args.summary.warningCount,
      summary: args.summary,
    })
    .select()
    .single();
  if (versionError) throw versionError;

  const { error: recordsError } = await supabase.from("session_results").insert(args.records.map((record) => ({
    import_version_id: id,
    ...record,
  })));
  if (recordsError) throw recordsError;

  return version as ImportVersion;
}

export async function listImportVersions(): Promise<ImportVersion[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("import_versions")
    .select("id, created_at, published_at, status, original_file_name, record_count, warning_count, summary, source_version_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as ImportVersion[];
}

export async function publishImportVersion(versionId: string): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc("publish_import_version", { target_version_id: versionId });
  if (error) throw error;
}

export async function restoreImportVersion(sourceVersionId: string): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc("restore_import_version", { source_version_id: sourceVersionId });
  if (error) throw error;
}
