import { describe, expect, it } from "vitest";

import { formatBb100, formatDateLong, formatPercent, formatPnl } from "./formatters";

describe("dashboard formatters", () => {
  it("formats signed P&L without forced decimals", () => {
    expect(formatPnl(1035)).toBe("+1,035");
    expect(formatPnl(-250)).toBe("-250");
    expect(formatPnl(39.5)).toBe("+39.5");
    expect(formatPnl(0)).toBe("0");
  });

  it("formats BB/100 and percentages with one decimal", () => {
    expect(formatBb100(410)).toBe("+410.0");
    expect(formatBb100(null)).toBe("—");
    expect(formatPercent(0.48)).toBe("48.0%");
  });

  it("formats ISO dates for display", () => {
    expect(formatDateLong("2026-08-15")).toBe("2026/08/15");
  });
});
