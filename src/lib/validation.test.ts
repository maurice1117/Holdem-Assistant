import { describe, expect, it, vi } from "vitest";

import { getDuplicateSessionResultKeys, parseSessionResults } from "./validation";

const validRecord = {
  game_date: "2026-08-15",
  session_number: 1,
  player_name: "Player",
  pnl: 25.5,
  participated: true,
  session_status: "WARNING" as const,
};

describe("session result validation", () => {
  it("accepts WARNING records without changing them", () => {
    expect(parseSessionResults([validRecord])).toEqual([validRecord]);
  });

  it("rejects invalid dates and non-finite P&L", () => {
    expect(() => parseSessionResults([{ ...validRecord, game_date: "2026-02-30" }])).toThrow();
    expect(() => parseSessionResults([{ ...validRecord, pnl: Number.NaN }])).toThrow();
  });

  it("reports duplicates without silently deleting them", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const records = parseSessionResults([validRecord, validRecord]);

    expect(records).toHaveLength(2);
    expect(getDuplicateSessionResultKeys(records)).toEqual(["2026-08-15::1::Player"]);
    expect(error).toHaveBeenCalledWith("資料存在重複紀錄", ["2026-08-15::1::Player"]);
    error.mockRestore();
  });
});
