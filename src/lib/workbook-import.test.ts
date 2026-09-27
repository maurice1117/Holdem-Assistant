import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";

import { parseSessionResultsWorkbook } from "./workbook-import";

const HEADERS = ["game_date", "session_number", "player_name", "pnl", "participated", "source_sheet", "source_row", "session_status"];

function makeWorkbook(rows: unknown[][], sheetName = "Clean_SessionResults"): Buffer {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([HEADERS, ...rows]), sheetName);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

describe("Excel import validation", () => {
  it("normalizes aliases and preserves WARNING/source lineage", () => {
    const result = parseSessionResultsWorkbook(makeWorkbook([
      ["2026-08-15", 1, "Kai", -100, true, "260815", 2, "WARNING"],
    ]));

    expect(result.errors).toEqual([]);
    expect(result.records).toEqual([expect.objectContaining({
      game_date: "2026-08-15",
      player_name: "大舅哥",
      source_player_name: "Kai",
      source_sheet: "260815",
      source_row: 2,
      session_status: "WARNING",
    })]);
    expect(result.summary).toMatchObject({ recordCount: 1, warningCount: 1, playerCount: 1 });
  });

  it("rejects a missing Clean_SessionResults worksheet", () => {
    const result = parseSessionResultsWorkbook(makeWorkbook([], "Other"));
    expect(result.errors[0]).toMatchObject({ field: "worksheet" });
  });

  it("rejects invalid dates, sessions, pnl and participation values", () => {
    const result = parseSessionResultsWorkbook(makeWorkbook([
      ["2026-02-30", 0, "玩家", "not-a-number", "maybe", "260815", 2, "VALID"],
    ]));
    expect(result.records).toEqual([]);
    expect(result.errors.map((error) => error.field)).toEqual(expect.arrayContaining([
      "game_date", "session_number", "pnl",
      "participated",
    ]));
  });

  it("rejects duplicate logical records after name aliases are applied", () => {
    const result = parseSessionResultsWorkbook(makeWorkbook([
      ["2026-08-15", 1, "Kai", 100, true, "260815", 2, "VALID"],
      ["2026-08-15", 1, "大舅哥", 200, true, "260815", 3, "VALID"],
    ]));
    expect(result.records).toEqual([]);
    expect(result.errors).toEqual([expect.objectContaining({ row: 3, field: "player_name" })]);
  });
});
