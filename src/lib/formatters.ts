const numberFormatter = new Intl.NumberFormat("zh-TW", {
  maximumFractionDigits: 1,
});

const bb100Formatter = new Intl.NumberFormat("zh-TW", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat("zh-TW", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatSigned(value: number, formatter: Intl.NumberFormat): string {
  if (value > 0) return `+${formatter.format(value)}`;
  return formatter.format(value);
}

export function formatPnl(value: number): string {
  return formatSigned(value, numberFormatter);
}

export function formatBb100(value: number | null): string {
  return value === null ? "—" : formatSigned(value, bb100Formatter);
}

export function formatPercent(value: number | null): string {
  return value === null ? "—" : percentFormatter.format(value);
}

export function formatCompactPnl(value: number): string {
  const absolute = Math.abs(value);
  if (absolute < 1000) return numberFormatter.format(value);
  return `${value < 0 ? "-" : ""}${numberFormatter.format(absolute / 1000)}k`;
}

export function formatDateShort(date: string): string {
  return date.slice(5).replace("-", "/");
}

export function formatDateLong(date: string): string {
  return date.replaceAll("-", "/");
}
