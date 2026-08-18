import { z } from "zod";

import type { SessionResult } from "../types/poker";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Invalid calendar date");

export const sessionResultSchema = z.object({
  game_date: isoDateSchema,
  session_number: z.number().int().positive(),
  player_name: z.string().trim().min(1),
  pnl: z.number().finite(),
  participated: z.boolean(),
  source_sheet: z.string().min(1).optional(),
  source_row: z.number().int().positive().optional(),
  session_status: z.enum(["VALID", "WARNING"]).optional(),
});

export const sessionResultsSchema = z.array(sessionResultSchema);

export function getSessionResultKey(record: SessionResult): string {
  return `${record.game_date}::${record.session_number}::${record.player_name}`;
}

export function getDuplicateSessionResultKeys(records: SessionResult[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const record of records) {
    const key = getSessionResultKey(record);
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }

  return [...duplicates];
}

export function parseSessionResults(input: unknown): SessionResult[] {
  const records = sessionResultsSchema.parse(input);
  const duplicateKeys = getDuplicateSessionResultKeys(records);

  if (duplicateKeys.length > 0) {
    console.error("資料存在重複紀錄", duplicateKeys);
  }

  return records;
}
