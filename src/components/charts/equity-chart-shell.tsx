"use client";

import dynamic from "next/dynamic";

import type { EquityCurvePoint } from "@/types/poker";

const EquityChart = dynamic(() => import("./equity-chart"), {
  ssr: false,
  loading: () => <div className="chart-loading" role="status" aria-label="圖表載入中" />,
});

interface EquityChartShellProps {
  curve: EquityCurvePoint[];
  allPlayers: string[];
  selectedPlayers: string[];
  onTogglePlayer: (player: string) => void;
}

export function EquityChartShell(props: EquityChartShellProps) {
  return <EquityChart {...props} />;
}
