import * as XLSX from "xlsx";

import { normalizePlayerName } from "../config/players";
import type { SessionResult } from "../types/poker";

import { getSessionResultKey, sessionResultSchema } from "./validation";

const REQUIRED_COLUMNS = ["game_date", "session_number", "player_name", "pnl", "participated"] as const;
const OPTIONAL_COLUMNS = ["source_sheet", "source_row", "session_status"] as const;

export interface ImportIssue {
  row: number;
  field: string;
  message: string;
}

export interface ImportedSessionResult extends SessionResult {
  source_player_name?: string;
}

export interface WorkbookImportSummary {
  recordCount: number;
  warningCount: number;
  playerCount: number;
  gameDateStart: string | null;
  gameDateEnd: string | null;
}

export interface WorkbookImportResult {
  records: ImportedSessionResult[];
  errors: ImportIssue[];
  summary: WorkbookImportSummary;
}

function getCell(row: unknown[], columns: Map<string, number>, column: string): unknown {
  const index = columns.get(column);
  return index === undefined ? undefined : row[index];
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim()) {
    const normalized = Number(value.replaceAll(",", "").trim());
    return Number.isFinite(normalized) ? normalized : undefined;
  }
  return undefined;
}

function asPositiveInteger(value: unknown): number | undefined {
  const normalized = asFiniteNumber(value);
  return normalized !== undefined && Number.isInteger(normalized) && normalized > 0 ? normalized : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toUpperCase();
  if (["TRUE", "T", "YES"].includes(normalized)) return true;
  if (["FALSE", "F", "NO"].includes(normalized)) return false;
  return undefined;
}

function asIsoDate(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return `${parsed.y.toString().padStart(4, "0")}-${parsed.m.toString().padStart(2, "0")}-${parsed.d.toString().padStart(2, "0")}`;
  }
  if (typeof value === "string") {
    const match = value.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (match) {
      const date = `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
      const candidate = new Date(`${date}T00:00:00Z`);
      if (!Number.isNaN(candidate.getTime()) && candidate.toISOString().slice(0, 10) === date) return date;
    }
  }
  return undefined;
}

function makeSummary(records: ImportedSessionResult[]): WorkbookImportSummary {
  const dates = records.map((record) => record.game_date).sort();
  return {
    recordCount: records.length,
    warningCount: records.filter((record) => record.session_status === "WARNING").length,
    playerCount: new Set(records.map((record) => record.player_name)).size,
    gameDateStart: dates.at(0) ?? null,
    gameDateEnd: dates.at(-1) ?? null,
  };
}

export function parseSessionResultsWorkbook(file: Buffer): WorkbookImportResult {
  const workbook = XLSX.read(file, { type: "buffer", cellDates: true });
  const worksheet = workbook.Sheets.Clean_SessionResults;
  if (!worksheet) {
    return { records: [], errors: [{ row: 0, field: "worksheet", message: "找不到 Clean_SessionResults 工作表。" }], summary: makeSummary([]) };
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: null, raw: true });
  const header = rows[0];
  if (!header) {
    return { records: [], errors: [{ row: 1, field: "header", message: "工作表沒有欄位標題。" }], summary: makeSummary([]) };
  }

  const columns = new Map(header.map((value, index) => [String(value).trim(), index]));
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !columns.has(column));
  if (missingColumns.length > 0) {
    return {
      records: [],
      errors: missingColumns.map((field) => ({ row: 1, field, message: "缺少必要欄位。" })),
      summary: makeSummary([]),
    };
  }

  const errors: ImportIssue[] = [];
  const records: ImportedSessionResult[] = [];
  const duplicateRows = new Map<string, number>();

  rows.slice(1).forEach((row, index) => {
    const excelRow = index + 2;
    if (row.every((value) => value === null || value === undefined || value === "")) return;

    const rawName = asNonEmptyString(getCell(row, columns, "player_name"));
    const participated = asBoolean(getCell(row, columns, "participated"));
    const hasParticipationError = participated === undefined;
    if (hasParticipationError) {
      errors.push({ row: excelRow, field: "participated", message: "必須是 TRUE 或 FALSE。" });
    }
    const record: ImportedSessionResult = {
      game_date: asIsoDate(getCell(row, columns, "game_date")) ?? "",
      session_number: asPositiveInteger(getCell(row, columns, "session_number")) ?? Number.NaN,
      player_name: rawName ? normalizePlayerName(rawName) : "",
      pnl: asFiniteNumber(getCell(row, columns, "pnl")) ?? Number.NaN,
      participated: participated ?? false,
      source_sheet: asNonEmptyString(getCell(row, columns, "source_sheet")),
      source_row: asPositiveInteger(getCell(row, columns, "source_row")),
      session_status: (() => {
        const value = asNonEmptyString(getCell(row, columns, "session_status"));
        return value ? value.toUpperCase() : undefined;
      })() as SessionResult["session_status"],
      source_player_name: rawName && rawName !== normalizePlayerName(rawName) ? rawName : undefined,
    };

    const parsed = sessionResultSchema.safeParse(record);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push({ row: excelRow, field: issue.path.join(".") || "record", message: issue.message });
      }
      return;
    }
    if (hasParticipationError) return;

    const key = getSessionResultKey(parsed.data);
    const existingRow = duplicateRows.get(key);
    if (existingRow) {
      errors.push({ row: excelRow, field: "player_name", message: `與第 ${existingRow} 列形成重複的日期、場次、玩家紀錄。` });
      return;
    }
    duplicateRows.set(key, excelRow);
    records.push(parsed.data);
  });

  return { records: errors.length === 0 ? records : [], errors, summary: makeSummary(records) };
}
