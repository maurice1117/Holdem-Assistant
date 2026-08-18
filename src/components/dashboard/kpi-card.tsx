import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone?: "profit" | "loss" | "accent" | "neutral";
}

export function KpiCard({ label, value, detail, icon, tone = "neutral" }: KpiCardProps) {
  return (
    <article className="metric-card" data-tone={tone}>
      <div className="metric-card-topline">
        <span className="metric-label">{label}</span>
        <span className="metric-icon" aria-hidden="true">
          {icon}
        </span>
      </div>
      <strong className="metric-value">{value}</strong>
      <span className="metric-detail">{detail}</span>
    </article>
  );
}
