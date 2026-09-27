"use client";

import dynamic from "next/dynamic";

import type { SessionResult } from "@/types/poker";

const ComparisonTrendChart = dynamic(() => import("./comparison-trend-chart"), {
  ssr: false,
  loading: () => <div className="chart-loading" role="status" aria-label="圖表載入中" />,
});

export function ComparisonTrendChartShell({
  records,
  players,
}: {
  records: SessionResult[];
  players: string[];
}) {
  return <ComparisonTrendChart records={records} players={players} />;
}
