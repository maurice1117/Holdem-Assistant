"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronDown, ChevronRight, Filter, ListOrdered, Users } from "lucide-react";

import { getGameDates, getPlayers, getSessionSummaries } from "@/lib/data";
import { formatDateLong, formatDateShort, formatPnl } from "@/lib/formatters";
import { getPlayerHref } from "@/lib/routes";
import type { SessionResult, SessionSummary } from "@/types/poker";

interface SessionsPageProps {
  records: SessionResult[];
}

function valueClass(value: number): string {
  if (value > 0) return "profit-value";
  if (value < 0) return "loss-value";
  return "neutral-value";
}

function playerResultLabel(records: SessionResult[]): string {
  return records.map((record) => record.player_name).join("、");
}

function SessionDetail({ session }: { session: SessionSummary }) {
  return (
    <div className="session-detail" aria-label={`${formatDateLong(session.gameDate)}第${session.sessionNumber}局明細`}>
      {session.records.map((record) => (
        <Link href={getPlayerHref(record.player_name)} className="session-player-result" key={record.player_name}>
          <span>{record.player_name}</span>
          <strong className={valueClass(record.pnl)}>{formatPnl(record.pnl)}</strong>
        </Link>
      ))}
    </div>
  );
}

export function SessionsPage({ records }: SessionsPageProps) {
  const dates = useMemo(() => getGameDates(records), [records]);
  const players = useMemo(() => getPlayers(records), [records]);
  const [selectedDate, setSelectedDate] = useState("all");
  const [selectedPlayer, setSelectedPlayer] = useState("all");
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const sessions = useMemo(() => {
    const dateRange = selectedDate === "all" ? undefined : { start: selectedDate, end: selectedDate };
    return getSessionSummaries(records, dateRange)
      .filter(
        (session) =>
          selectedPlayer === "all" ||
          session.records.some((record) => record.player_name === selectedPlayer),
      )
      .sort(
        (a, b) =>
          b.gameDate.localeCompare(a.gameDate) || b.sessionNumber - a.sessionNumber,
      );
  }, [records, selectedDate, selectedPlayer]);

  const toggleSession = (key: string) => {
    setExpandedSession((current) => (current === key ? null : key));
  };

  return (
    <main className="dashboard-shell">
      <section className="dashboard-header sessions-header">
        <div>
          <div className="eyebrow">TABLE HISTORY</div>
          <h1>每局紀錄</h1>
          <p>展開任一局，查看同桌所有玩家的 P&amp;L</p>
        </div>
        <div className="session-filters" aria-label="每局紀錄篩選">
          <label className="date-filter">
            <span>
              <CalendarDays size={15} aria-hidden="true" />
              遊戲日期
            </span>
            <div className="select-wrap">
              <select value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}>
                <option value="all">全部期間</option>
                {[...dates].reverse().map((date) => (
                  <option value={date} key={date}>
                    {formatDateLong(date)}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </div>
          </label>
          <label className="date-filter">
            <span>
              <Filter size={15} aria-hidden="true" />
              玩家
            </span>
            <div className="select-wrap">
              <select value={selectedPlayer} onChange={(event) => setSelectedPlayer(event.target.value)}>
                <option value="all">全部玩家</option>
                {players.map((player) => (
                  <option value={player} key={player}>
                    {player}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </div>
          </label>
        </div>
      </section>

      <section className="surface sessions-card">
        <div className="section-heading">
          <div>
            <div className="section-kicker">
              <ListOrdered size={14} aria-hidden="true" />
              SESSION HISTORY
            </div>
            <h2>{sessions.length} 局</h2>
            <p>依最新局次排序；點選列可展開詳細戰績</p>
          </div>
        </div>
        {sessions.length === 0 ? (
          <div className="empty-panel">沒有符合篩選條件的局次。</div>
        ) : (
          <div className="table-scroll">
            <table className="leaderboard-table sessions-table">
              <thead>
                <tr>
                  <th scope="col">日期</th>
                  <th scope="col">局</th>
                  <th scope="col">人數</th>
                  <th scope="col">最大贏家</th>
                  <th scope="col">最大輸家</th>
                  <th scope="col"><span className="sr-only">展開</span></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const isExpanded = expandedSession === session.key;
                  return (
                    <SessionRow
                      isExpanded={isExpanded}
                      key={session.key}
                      onToggle={() => toggleSession(session.key)}
                      session={session}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function SessionRow({
  isExpanded,
  onToggle,
  session,
}: {
  isExpanded: boolean;
  onToggle: () => void;
  session: SessionSummary;
}) {
  return (
    <>
      <tr className="session-summary-row" onClick={onToggle}>
        <td>{formatDateShort(session.gameDate)}</td>
        <td>第{session.sessionNumber}局</td>
        <td className="sessions-cell"><Users size={13} aria-hidden="true" /> {session.participantCount}</td>
        <td className="session-result-cell">
          <span>{playerResultLabel(session.winners)}</span>
          <strong className="profit-value">{formatPnl(session.largestWin)}</strong>
        </td>
        <td className="session-result-cell">
          <span>{playerResultLabel(session.losers)}</span>
          <strong className="loss-value">{formatPnl(session.largestLoss)}</strong>
        </td>
        <td className="session-expand-cell">
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-label={`展開${formatDateLong(session.gameDate)}第${session.sessionNumber}局`}
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
          >
            {isExpanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
          </button>
        </td>
      </tr>
      {isExpanded ? (
        <tr className="session-detail-row">
          <td colSpan={6}>
            <SessionDetail session={session} />
          </td>
        </tr>
      ) : null}
    </>
  );
}
