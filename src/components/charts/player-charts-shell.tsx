"use client";

import dynamic from "next/dynamic";

import type { CumulativePnlPoint, DailyPlayerResult, PlayerTrendPoint } from "@/types/poker";

const PlayerEquityChart = dynamic(
  () => import("./player-charts").then((module) => module.PlayerEquityChart),
  {
    ssr: false,
    loading: () => <div className="chart-loading detail-loading" role="status" aria-label="圖表載入中" />,
  },
);

const PlayerDailyChart = dynamic(
  () => import("./player-charts").then((module) => module.PlayerDailyChart),
  {
    ssr: false,
    loading: () => <div className="chart-loading detail-loading" role="status" aria-label="圖表載入中" />,
  },
);

const PlayerMovingAverageChart = dynamic(
  () => import("./player-charts").then((module) => module.PlayerMovingAverageChart),
  { ssr: false, loading: () => <div className="chart-loading detail-loading" role="status" aria-label="圖表載入中" /> },
);

const PlayerDrawdownChart = dynamic(
  () => import("./player-charts").then((module) => module.PlayerDrawdownChart),
  { ssr: false, loading: () => <div className="chart-loading detail-loading" role="status" aria-label="圖表載入中" /> },
);

export function PlayerEquityChartShell({ points }: { points: CumulativePnlPoint[] }) {
  return <PlayerEquityChart points={points} />;
}

export function PlayerDailyChartShell({ results }: { results: DailyPlayerResult[] }) {
  return <PlayerDailyChart results={results} />;
}

export function PlayerMovingAverageChartShell({ points }: { points: PlayerTrendPoint[] }) {
  return <PlayerMovingAverageChart points={points} />;
}

export function PlayerDrawdownChartShell({ points }: { points: PlayerTrendPoint[] }) {
  return <PlayerDrawdownChart points={points} />;
}
