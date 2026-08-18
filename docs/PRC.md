# 德州撲克戰績 Dashboard — PRD

**Version:** V1
**Status:** Ready for implementation
**Primary data source:** `Clean_SessionResults`
**Product type:** Responsive web dashboard
**Target:** Desktop-first, fully usable on mobile
**Data strategy:** Static JSON
**Authentication:** None
**Backend / Database:** None in V1

---

# 1. Product Overview

建立一個用於查看朋友間德州撲克戰績的 Web Dashboard。

產品核心不是單純把 Excel 畫成幾張圖，而是建立一個「**Poker Performance Dashboard**」，讓使用者可以快速回答：

* 現在誰贏最多？
* 誰的 BB/100 最強？
* 每個人的戰績是一路贏上去，還是波動很大？
* 誰近期狀況最好？
* 某個玩家打了幾局、勝率多少、最大回撤多少？
* 某一天大家分別輸贏多少？
* 某一局發生了什麼？
* 誰最常爆掉？
* 誰有最長連勝 / 連敗？

視覺上應該像：

> **Bloomberg / trading performance dashboard × private poker room**

而不是廉價 casino website。

整體應偏 data-heavy、俐落、有競爭感、有一點娛樂性。

---

# 2. Confirmed Product Decisions

以下為 V1 已確認、不需要 Codex 再詢問的決策。

| 項目                       | 決策                                        |
| ------------------------ | ----------------------------------------- |
| UI 中 `session_number` 名稱 | **局**                                     |
| 歷史戰績起點                   | **只使用 Clean_SessionResults**              |
| 遠古時代資料                   | 不納入                                       |
| WARNING session          | **照常計入所有統計，不排除、不修正**                      |
| WARNING UI               | 不需要顯示 warning badge/filter                |
| 主要排行榜                    | **總 P&L + BB/100 兩種**                     |
| BB                       | **5**                                     |
| P&L 單位                   | **NT$**                                   |
| BB/100 正式排行榜門檻           | **至少 10 局**                               |
| 資料更新                     | V1 使用 **static JSON**                     |
| Excel runtime upload     | 不做                                        |
| Login                    | 不做                                        |
| Backend                  | 不做                                        |
| Database                 | 不做                                        |
| Style                    | **Dark Poker Room × Financial Dashboard** |

---

# 3. Source Data

## 3.1 Excel Sheet

唯一主要資料來源：

`Clean_SessionResults`

不要使用以下 Sheet 計算 Dashboard 戰績：

* 總表(包含飯錢)
* 純戰鬥紀錄
* 分析
* 260725
* 260731
* 260815

這些只屬於 legacy / source data。

---

# 4. Current Dataset Baseline

目前 `Clean_SessionResults` 應包含：

* **148 筆 player-session records**
* **25 局**
* **3 個遊戲日**
* **10 位玩家**

目前日期：

* 2026-07-25
* 2026-07-31
* 2026-08-15

這些數字應作為開發完成後的 smoke test。

---

# 5. Data Schema

Static JSON 建議路徑：

`src/data/session-results.json`

每一筆資料代表：

> 某一個玩家，在某一個遊戲日的某一局中的最終 P&L。

Schema：

```ts
export interface SessionResult {
  game_date: string;          // YYYY-MM-DD
  session_number: number;     // UI 顯示為「局」
  player_name: string;
  pnl: number;
  participated: boolean;

  // 以下欄位保留作 data lineage，
  // V1 UI 不需要顯示
  source_sheet?: string;
  source_row?: number;
  session_status?: "VALID" | "WARNING";
}
```

唯一 logical key：

```ts
game_date + session_number + player_name
```

例如：

```json
{
  "game_date": "2026-07-25",
  "session_number": 1,
  "player_name": "強的可怕",
  "pnl": -45,
  "participated": true,
  "source_sheet": "260725",
  "source_row": 2,
  "session_status": "VALID"
}
```

---

# 6. Game Configuration

不要把魔法數字散落在程式裡。

建立：

`src/config/game.ts`

例如：

```ts
export const GAME_CONFIG = {
  bigBlind: 5,
  currency: "TWD",
  minBb100Sessions: 10,
};
```

V1 BB 固定為 NT$5。

未來可能擴充成不同日期不同 blind，但 V1 不需要實作。

---

# 7. Data Handling Rules

## 7.1 Participated

只有：

```ts
participated === true
```

才納入：

* 局數
* P&L
* BB/100
* 勝率
* streak
* drawdown
* 其他 player metrics

---

## 7.2 WARNING

`session_status === "WARNING"`：

**仍然視為正常戰績。**

禁止：

* 排除
* 修改
* 自動 balancing
* 把 P&L 補成 zero-sum
* 顯示 warning badge

也就是：

> Dashboard 必須 faithfully reproduce `Clean_SessionResults`，不能「修正」來源資料。

---

# 8. Core Metric Definitions

所有計算集中放在：

`src/lib/metrics.ts`

避免 Component 各自重複計算。

---

## 8.1 Played Sessions / 局數

```ts
playedSessions =
  count(records where player_name === player && participated === true)
```

---

## 8.2 Total P&L / 總損益

```ts
totalPnl = sum(pnl)
```

顯示：

`+1,035`

`-250`

不要顯示：

`1035.000`

Component label 已標示 `P&L (NT$)` 時，不需要每個數字重新寫 NT$。

---

## 8.3 Total BB

```ts
totalBB = totalPnl / bigBlind
```

目前：

```ts
totalBB = totalPnl / 5
```

---

## 8.4 BB/100

沿用目前 Excel 的定義：

```ts
bb100 =
  (totalPnl / bigBlind / playedSessions) * 100
```

即：

```ts
bb100 =
  (totalPnl / 5 / playedSessions) * 100
```

UI 建議名稱：

**BB/100局**

避免與正式 poker hand database 的「每 100 hands」定義混淆。

Tooltip：

> 每 100 局平均損益換算成 Big Blind。BB = NT$5。

---

# 9. BB/100 Sample Size Rule

BB/100 正式排行榜要求：

```ts
playedSessions >= 10
```

低於 10 局：

* 仍顯示 BB/100 數值
* 不給正式 rank number
* 顯示 badge：

`樣本不足 · 3局`

例如目前：

* Kai：3 局
* Z隕石毀滅者：3 局

兩人均不進正式 BB/100 排名。

---

# 10. Win Rate

一局：

```ts
pnl > 0 → Win
pnl < 0 → Loss
pnl === 0 → Push
```

勝率：

```ts
winRate =
  wins / playedSessions
```

**Push 仍留在 denominator。**

例如：

12 Win / 25 局：

```text
48.0%
```

Player Detail 同時顯示：

`12W · 9L · 4P`

---

# 11. Average P&L

```ts
averagePnl = totalPnl / playedSessions
```

顯示：

`+20.5 / 局`

---

# 12. Best / Worst Session

```ts
bestSession = max(pnl)
worstSession = min(pnl)
```

必須可以取得：

* game_date
* session_number
* pnl

以便 tooltip / detail 顯示：

> 2026/08/15 · 第 3 局 · +452.5

---

# 13. Cumulative P&L

排序順序：

```ts
game_date ASC
session_number ASC
```

Player cumulative P&L：

```ts
cumulative[n] =
  cumulative[n - 1] + pnl[n]
```

初始值：

```ts
0
```

---

# 14. Equity Curve Behavior

首頁多人 Equity Curve 使用共同的 global session timeline。

建立：

```ts
globalSessionKey =
  game_date + session_number
```

例如：

```text
2026-07-25 #1
2026-07-25 #2
...
2026-07-31 #1
...
```

如果某位玩家沒有參與某一局：

**累積 P&L carry forward。**

例如：

```text
前一局 cumulative = +200

下一局玩家沒參加

chart value 仍為 +200
```

但是：

* 不增加該玩家 playedSessions
* 不影響 win rate
* 不影響 BB/100
* 不影響 streak

這只是為了多人 equity curve 能共享同一條 X-axis。

---

# 15. Peak P&L

```ts
peakPnl =
  max(0, ...cumulativePnl)
```

起點視為 0。

---

# 16. Max Drawdown

定義：

> 從歷史累積 P&L 高點到後續最低點的最大跌幅。

計算：

```ts
runningPeak =
  max(previousRunningPeak, cumulativePnl)

drawdown =
  runningPeak - cumulativePnl

maxDrawdown =
  max(drawdown)
```

注意：

初始 peak = 0。

因此如果玩家一開始就輸錢，仍會形成 drawdown。

顯示：

`-692.5`

或：

`692.5 drawdown`

推薦 UI 使用後者：

**Max Drawdown
NT$692.5**

---

# 17. Current Drawdown

```ts
currentDrawdown =
  historicalPeak - currentCumulativePnl
```

Player detail 可顯示。

首頁不用。

---

# 18. Session Standard Deviation

使用 sample standard deviation：

相當於 Excel：

```text
STDEV.S
```

公式概念：

```ts
sessionStdDev = sampleStandardDeviation(playerPnl)
```

Player Detail Advanced Stats 顯示：

**波動度 / 局**

---

# 19. 100-Session Standard Deviation

沿用現有 Excel 邏輯：

```ts
stdBB100 =
  (sessionStdDev / bigBlind) * sqrt(100)
```

即：

```ts
stdBB100 =
  sessionStdDev / 5 * 10
```

放在 Advanced Stats。

不是 Homepage KPI。

---

# 20. Winning / Losing Streak

Win：

```ts
pnl > 0
```

Loss：

```ts
pnl < 0
```

Push：

```ts
pnl === 0
```

**Push 會中斷 streak。**

計算：

* Longest winning streak
* Longest losing streak
* Current streak

例如：

`🔥 7 連勝`

`❄️ 4 連敗`

---

# 21. Bust Count

增加一個較娛樂性的 Poker metric：

### 爆掉次數

目前資料中 `-250` 很像一次完整 buy-in loss，因此定義：

```ts
bustCount =
  count(pnl <= -250)
```

UI label：

**爆掉次數**

Tooltip：

> 單局 P&L ≤ -250 的局數。

這個 threshold 應放 config：

```ts
bustThreshold: -250
```

不要散落 hard-code。

---

# 22. Game-Day P&L

同一玩家同一日期：

```ts
dailyPnl =
  sum(player pnl on game_date)
```

用於：

* Heatmap
* Player Detail 日別戰績
* 日期 filter

---

# 23. Ranking Rules

## Total P&L Ranking

Sort：

```ts
totalPnl DESC
```

若數值完全相同：

**顯示相同名次。**

例如：

```text
#4 河牌幹死你 +177.5
#4 大舅哥     +177.5
```

不要假裝其中一個人戰績更好。

---

## BB/100 Ranking

只對：

```ts
playedSessions >= 10
```

提供正式排名。

Sort：

```ts
bb100 DESC
```

低樣本玩家另外置於下方：

`樣本不足`

---

# 24. Information Architecture

V1 共三個主要 route：

```text
/
├── Overview Dashboard

/players/[playerSlug]
├── Player Detail

/sessions
└── Session History
```

Navbar：

```text
戰績總覽 | 每局紀錄
```

點任何玩家名稱：

→ `/players/[playerSlug]`

---

# 25. Page 1 — Overview Dashboard

Route：

`/`

---

# 26. Header

左側：

**德州撲克戰績**

Subtitle：

```text
2026/07/25 – 2026/08/15 · BB NT$5
```

右側：

Game Date filter。

Options：

```text
全部
2026/08/15
2026/07/31
2026/07/25
```

日期新增時自動產生。

不要 hard-code 日期選項。

---

# 27. Global Date Filter

Date filter 影響：

* KPI
* P&L leaderboard
* BB/100 leaderboard
* Equity curve
* Heatmap
* Recent Sessions

Default：

`全部`

Player detail 有自己的 date filter。

---

# 28. KPI Row

Desktop：

6 cards 一列。

Tablet：

3 × 2。

Mobile：

2 × 3 或水平 swipe。

---

## KPI 1 — 總局數

目前 All-Time：

**25**

---

## KPI 2 — 玩家數

目前：

**10**

定義：

篩選期間內至少參與一局的 unique players。

---

## KPI 3 — 戰績王

顯示：

玩家名稱

以及：

Total P&L。

目前 All-Time expected：

**我是你爸**

**+1,035**

---

## KPI 4 — BB/100 王者

只使用符合最低 10 局門檻者。

目前：

**我是你爸**

**+1,478.6 BB/100**

Subtitle：

`14 局`

---

## KPI 5 — 最大單局勝利

目前：

**+452.5**

玩家：

**我是你爸**

Subtitle：

`08/15 · 第3局`

---

## KPI 6 — 最大單局虧損

目前：

**-250**

因目前多人並列：

不要任意指定單一「最大輸家」。

顯示：

**-250**

Subtitle 可以顯示：

`19 次出現`

點擊後可進 Session page 並 filter。

---

# 29. Main Equity Curve

KPI 下方作為首頁主要視覺。

Title：

**累積戰績**

Subtitle：

`Cumulative P&L`

Chart：

Recharts `LineChart`

---

## Default Lines

預設顯示：

所有符合：

```ts
playedSessions >= 10
```

的玩家。

低樣本玩家可以透過 Player selector 開啟。

目前約 8 條主要 curve。

---

## Player Selector

Chart 右上角：

`玩家 ▾`

Multi-select。

支援：

* 全選
* 全不選
* 個別玩家
* 顯示低樣本玩家

---

## X Axis

共同 global session timeline。

Label 可簡化成：

```text
07/25 #1
07/25 #2
...
08/15 #14
```

不要每一 tick 全部顯示，以避免過密。

---

## Y Axis

P&L (NT$)

0 line 必須比其他 grid line 明顯。

---

## Tooltip

Hover 某一個 point：

```text
2026/08/15 · 第 7 局

強的可怕
本局      -140
累積      +77.5
```

若該玩家沒有參加該 global session：

顯示：

```text
未參加
累積 +217.5
```

---

# 30. Equity Curve Interaction

Legend 中玩家名稱：

click：

toggle curve。

Double click 不需要。

點玩家名稱：

進 Player Detail。

Chart 支援：

* hover
* tooltip
* responsive width

不用做 zoom/pan。

---

# 31. Leaderboards

Equity Curve 下方：

Desktop：

```text
┌──────────────────┬──────────────────┐
│ 總 P&L 排行榜     │ BB/100 排行榜     │
└──────────────────┴──────────────────┘
```

Mobile：

上下排列。

---

# 32. P&L Leaderboard

Columns：

```text
Rank
Player
局數
P&L
```

每列可以包含迷你 trend sparkline。

Profit：

green。

Loss：

red。

Zero：

neutral.

前三名：

* #1 可使用 subtle gold accent
* #2 silver
* #3 bronze

不要過度 casino 化。

---

# 33. BB/100 Leaderboard

Columns：

```text
Rank
Player
局數
BB/100
```

正式玩家在上方。

低樣本在分隔線以下：

```text
── 樣本不足 ──

Kai
3 局
-1366.7
樣本不足
```

---

# 34. Game-Day Heatmap

Title：

**每日戰績**

Rows：

players

Columns：

game dates

Cell：

該 player 的 daily total P&L。

例如：

```text
               07/25     07/31     08/15
強的可怕       -155      +640       +27.5
KK之王         +142.5    -245        ...
...
```

實際數字必須由資料計算，不使用上述示例 hard-code。

---

## Heatmap Coloring

Positive：

green intensity。

Negative：

red intensity。

Near zero：

dark neutral。

每格同時顯示數字。

**不可只靠顏色表達資訊。**

---

## Heatmap Interaction

Hover：

```text
強的可怕
2026/08/15

P&L +27.5
14 局
```

點 player name：

Player Detail。

---

# 35. Recent Sessions

首頁底部：

**最近戰局**

預設顯示最新 5 局。

Columns：

```text
日期
局
人數
最大贏家
最大輸家
```

例如：

```text
08/15
第14局
7人
KK之王 +177.5
中 -250
```

右上：

`查看全部 →`

→ `/sessions`

---

# 36. Page 2 — Player Detail

Route：

`/players/[playerSlug]`

例如：

```text
/players/強的可怕
```

實作時 slug 必須安全 encode。

---

# 37. Player Header

例如：

**強的可怕**

Subtitle：

```text
25 局 · 2026/07/25 至今
```

右側：

Date filter。

---

# 38. Player Main Stats

第一排：

1. Total P&L
2. BB/100
3. 局數
4. 勝率

第二排：

5. Avg P&L / 局
6. Max Drawdown
7. Best Session
8. Worst Session

---

# 39. Player Record

顯示：

```text
12W · 11L · 2P
```

以及：

```text
48.0% 勝率
```

---

# 40. Player Equity Curve

單人專用 cumulative P&L chart。

X-axis：

只需要玩家實際參與的局。

Tooltip：

```text
08/15 · 第 11 局

本局
+270

累積
+235
```

可以加 drawdown 區間，但 V1 非必要。

---

# 41. Player Performance by Game Day

Bar chart。

X：

Game Date。

Y：

Daily P&L。

Positive / Negative clearly distinguish。

---

# 42. Player Advanced Stats

Section：

**進階數據**

顯示：

* Peak P&L
* Current Drawdown
* Max Drawdown
* Session Standard Deviation
* BB/100 Standard Deviation
* Longest Winning Streak
* Longest Losing Streak
* Current Streak
* Bust Count

---

# 43. Player Session History

Table：

```text
日期
局
P&L
累積 P&L
結果
```

Result：

```text
Win
Loss
Push
```

支援：

* Date sort
* P&L sort
* Win/Loss filter

Default：

最新 → 最舊。

---

# 44. Page 3 — Sessions

Route：

`/sessions`

目的：

查看每一局完整牌桌戰績。

---

# 45. Session Filters

Top filter bar：

### Date

```text
全部
08/15
07/31
07/25
```

### Player

Search / Select：

例如輸入：

`強`

即可找到：

`強的可怕`

---

# 46. Session Table

每列代表：

```text
game_date + session_number
```

Columns：

```text
日期
局
參與人數
最大贏家
最大輸家
```

Default sort：

```text
game_date DESC
session_number DESC
```

---

# 47. Expandable Session Row

Click row 展開：

```text
2026/08/15 · 第3局

我是你爸       +452.5
大舅哥          +25
淡水金城武        0
KK之王          -30
強的可怕        -42.5
中             -155
帥潮           -250
```

排序：

```ts
pnl DESC
```

Positive：

green。

Negative：

red。

Push：

muted。

---

# 48. Do Not Display Session Balance

由於 WARNING sessions 被視為正常資料：

不要在一般 UI 顯示：

* session total
* balance check
* WARNING
* VALID

避免讓使用者誤以為 Dashboard 自己算錯。

來源資料保持原樣即可。

---

# 49. Visual Design Direction

## Design Keywords

* premium
* dark
* financial
* competitive
* poker
* data-dense
* modern
* understated

不要：

* neon casino
* Vegas slot machine
* playing card wallpaper
* 大量紅黑漸層
* gold everywhere
* 3D poker chips everywhere

---

# 50. Suggested Color System

Background：

```text
#080B10
```

Secondary background：

```text
#0D121A
```

Cards：

```text
#111821
```

Border：

```text
#202936
```

Primary text：

```text
#F3F4F6
```

Muted：

```text
#8B98A8
```

Profit：

```text
#22C55E
```

Loss：

```text
#EF4444
```

Poker / Champion Accent：

```text
#D6B35A
```

不要讓綠 / 紅成為唯一資訊來源。

正負值仍必須有：

`+`

`-`

---

# 51. Typography

建議：

* Geist
* Inter

數值建議使用 tabular numbers：

```css
font-variant-numeric: tabular-nums;
```

所有 P&L / BB 數值 alignment 應整齊。

---

# 52. Layout

最大 content width：

約：

```text
1440px
```

Desktop 偏寬，充分利用螢幕。

Cards：

12–16px radius。

Border subtle。

Shadow very minimal。

---

# 53. Responsive Requirements

## Desktop ≥ 1200px

完整 dashboard layout。

兩個 leaderboard 並排。

KPI 6 張一排。

---

## Tablet

KPI 3 × 2。

排行榜仍可視空間並排或 stack。

---

## Mobile

KPI：

2 columns。

Leaderboard：

stack。

Heatmap：

horizontal scroll。

Sessions：

compact table / cards。

Charts：

至少 320px height。

所有 tooltip 必須 touch-friendly。

---

# 54. Number Formatting

使用共用 formatter。

例如：

```ts
formatPnl(1035)
→ "+1,035"

formatPnl(-250)
→ "-250"

formatPnl(39.5)
→ "+39.5"
```

不要強制 `.0`。

BB/100：

最多一位小數。

例如：

```text
+1,478.6
+410.0
-835.0
```

百分比：

一位小數。

```text
48.0%
```

---

# 55. Empty State

如果 filter 組合沒有資料：

顯示：

**這段期間沒有戰績。**

不要：

* render broken chart
* throw error
* 顯示 NaN
* 顯示 Infinity

---

# 56. Divide-by-Zero Protection

如果：

```ts
playedSessions === 0
```

則：

```ts
bb100 = null
winRate = null
averagePnl = null
```

UI：

`—`

---

# 57. Duplicate Handling

如果 JSON 中發現 duplicate：

```text
game_date +
session_number +
player_name
```

不要 silent dedupe。

Development：

```ts
console.error(...)
```

Production：

顯示 non-blocking：

`資料存在重複紀錄`

但是不要自行刪資料。

---

# 58. Player Identification

Player name 是 primary display identity。

目前包括：

* 強的可怕
* KK之王
* 河牌幹死你
* 淡水金城武
* Kai
* Z隕石毀滅者
* 中
* 我是你爸
* 大舅哥
* 帥潮

不要把 player names hard-code 進 UI。

必須從 data 自動產生。

---

# 59. Features Explicitly Out of Scope — V1

不要實作：

* Login
* Account
* Permission
* Database
* Backend API
* Cloud sync
* Excel upload UI
* Live game entry
* Buy-in entry system
* Meal cost
* 遠古時代數據
* WARNING management UI
* Hand history
* Hole cards
* VPIP
* PFR
* 3-bet %
* showdown %
* opponent transfer tracking
* 真正 head-to-head 輸贏
* 「誰剋誰」

---

# 60. Why Head-to-Head Is Out of Scope

目前資料只知道：

> 一局結束時每人的淨 P&L。

不知道：

> 玩家 A 的 NT$250 到底是輸給 B、C 還是 D。

因此不能合理計算：

```text
A vs B
```

的真實 head-to-head。

不要從同桌結果推測「剋制」。

未來若有 hand-level 或 transfer-level data 再做。

---

# 61. Static Data Architecture

建議：

```text
src/
├── app/
│   ├── page.tsx
│   ├── sessions/
│   │   └── page.tsx
│   └── players/
│       └── [playerSlug]/
│           └── page.tsx
│
├── components/
│   ├── dashboard/
│   ├── charts/
│   ├── leaderboard/
│   ├── sessions/
│   └── ui/
│
├── config/
│   └── game.ts
│
├── data/
│   └── session-results.json
│
├── lib/
│   ├── data.ts
│   ├── metrics.ts
│   ├── formatters.ts
│   └── validation.ts
│
└── types/
    └── poker.ts
```

---

# 62. Recommended Stack

Use:

* Next.js App Router
* TypeScript
* Tailwind CSS
* Recharts
* Lucide icons
* Zod for dataset validation

可以使用 shadcn/ui primitives。

但：

**不要讓網站看起來像預設 shadcn demo。**

需要做 poker dashboard 自有 visual identity。

---

# 63. Runtime Architecture

V1 不需要 API request。

直接：

```ts
import sessionResults from "@/data/session-results.json";
```

Data size 很小，可以 client-side aggregate。

Metric functions 應為 pure functions。

例如：

```ts
getPlayers()
getSessions()
getPlayerStats()
getLeaderboard()
getEquityCurve()
getGameDayMatrix()
getSessionSummary()
```

---

# 64. Suggested Metrics API

```ts
getPlayerStats(
  records: SessionResult[],
  playerName: string
): PlayerStats
```

PlayerStats：

```ts
interface PlayerStats {
  playerName: string;

  playedSessions: number;

  totalPnl: number;
  totalBB: number;
  bb100: number | null;

  wins: number;
  losses: number;
  pushes: number;
  winRate: number | null;

  averagePnl: number | null;

  bestSession: SessionResult | null;
  worstSession: SessionResult | null;

  peakPnl: number;
  currentDrawdown: number;
  maxDrawdown: number;

  sessionStdDev: number | null;
  stdBB100: number | null;

  longestWinStreak: number;
  longestLossStreak: number;

  currentStreak: {
    type: "win" | "loss" | "none";
    count: number;
  };

  bustCount: number;
}
```

---

# 65. Date Filtering Architecture

所有 selectors 接受：

```ts
dateRange?: {
  start?: string;
  end?: string;
}
```

不要直接在 React component 中：

```ts
.filter(...)
.reduce(...)
.reduce(...)
```

一再重算。

集中於 data / metrics utilities。

---

# 66. Performance

目前只有 148 records。

不需要：

* database
* pagination backend
* worker
* server caching
* virtualization

但是 utility functions 可以搭配：

```ts
useMemo
```

避免互動時無意義重算。

---

# 67. Accessibility

必須：

* Keyboard accessible controls
* Visible focus state
* Chart tooltip contrast sufficient
* Profit/loss 不只使用顏色
* Mobile tap targets ≥ 40px
* Tables 有 semantic header

---

# 68. Current Dataset Acceptance Tests

Codex 完成後，All-Time Filter 必須得到以下結果。

---

## Dataset

```text
Total sessions = 25
Players = 10
Game days = 3
Player-session records = 148
```

---

# 69. Total P&L Expected Results

### 我是你爸

```text
局數       14
P&L        +1,035
BB/100     +1,478.6
勝率       57.1%
Best       +452.5
Worst      -250
Max DD     692.5
```

---

### 強的可怕

```text
局數       25
P&L        +512.5
BB/100     +410.0
勝率       48.0%
Best       +270
Worst      -250
Max DD     457
```

---

### KK之王

```text
局數       25
P&L        +194
BB/100     +155.2
勝率       40.0%
```

---

### 河牌幹死你

```text
局數       11
P&L        +177.5
BB/100     +322.7
勝率       54.5%
```

---

### 大舅哥

```text
局數       14
P&L        +177.5
BB/100     +253.6
勝率       42.9%
```

---

### 淡水金城武

```text
局數       25
P&L        +39.5
BB/100     +31.6
勝率       48.0%
```

---

### Kai

```text
局數       3
P&L        -205
BB/100     -1,366.7
```

BB/100：

`樣本不足`

---

### Z隕石毀滅者

```text
局數       3
P&L        -210
BB/100     -1,400.0
```

BB/100：

`樣本不足`

---

### 中

```text
局數       14
P&L        -584.5
BB/100     -835.0
勝率       21.4%
```

---

### 帥潮

```text
局數       14
P&L        -1,007.5
BB/100     -1,439.3
勝率       28.6%
```

---

# 70. Expected P&L Leaderboard

All-Time：

```text
#1  我是你爸       +1,035
#2  強的可怕         +512.5
#3  KK之王           +194
#4  河牌幹死你       +177.5
#4  大舅哥           +177.5
#6  淡水金城武        +39.5
#7  Kai              -205
#8  Z隕石毀滅者      -210
#9  中               -584.5
#10 帥潮           -1,007.5
```

河牌幹死你與大舅哥同為 +177.5：

**必須同 rank。**

---

# 71. Expected Official BB/100 Ranking

Minimum：

10 局。

```text
#1 我是你爸       +1,478.6
#2 強的可怕         +410.0
#3 河牌幹死你       +322.7
#4 大舅哥           +253.6
#5 KK之王           +155.2
#6 淡水金城武        +31.6
#7 中               -835.0
#8 帥潮           -1,439.3
```

Below ranking：

```text
Kai
-1,366.7
樣本不足 · 3局

Z隕石毀滅者
-1,400.0
樣本不足 · 3局
```

---

# 72. Expected Largest Win

```text
Player:
我是你爸

Date:
2026-08-15

局:
3

P&L:
+452.5
```

---

# 73. Expected Largest Loss

```text
P&L:
-250

Occurrences:
19
```

因為多人並列，不應該宣稱某一人是唯一最大輸家。

---

# 74. Data Refresh Workflow — V1

網站 runtime 不讀 Excel。

但建議提供 developer-only script：

```text
scripts/export-session-results
```

用途：

讀取：

`戰積可查_清洗完成.xlsx`

中的：

`Clean_SessionResults`

並覆蓋：

`src/data/session-results.json`

---

## Suggested command

例如：

```bash
pnpm data:refresh ./data/戰積可查_清洗完成.xlsx
```

這不是 Upload feature。

只是開發者更新 static JSON 的工具。

---

# 75. Excel Conversion Requirements

轉換時：

1. 只讀 `Clean_SessionResults`
2. 保留所有 148 筆 records
3. 不讀其他 sheet
4. 不排除 WARNING
5. 不重新 balance
6. 保留 decimal
7. `game_date` normalize 成 `YYYY-MM-DD`
8. `session_number` normalize 成 integer
9. `pnl` normalize 成 number
10. JSON 完成後用 Zod validate

---

# 76. Testing Requirements

至少對：

`metrics.ts`

做 unit tests。

測：

* total P&L
* BB/100
* win rate
* push
* max drawdown
* streak
* low sample BB/100
* cumulative P&L
* date filter
* ties
* player missing session

---

# 77. Required Smoke Tests

例如：

```ts
expect(getPlayerStats(data, "我是你爸").totalPnl)
  .toBe(1035);

expect(getPlayerStats(data, "我是你爸").playedSessions)
  .toBe(14);

expect(
  getPlayerStats(data, "強的可怕").totalPnl
).toBe(512.5);
```

以及：

```ts
expect(getSessions(data).length)
  .toBe(25);

expect(getPlayers(data).length)
  .toBe(10);
```

---

# 78. Definition of Done

V1 完成必須符合：

* [ ] 首頁 Dashboard 可正常使用
* [ ] Static JSON 使用完整 Clean_SessionResults
* [ ] KPI 數字正確
* [ ] Total P&L leaderboard 正確
* [ ] BB/100 leaderboard 正確
* [ ] <10 局玩家顯示樣本不足
* [ ] Equity curve 正確
* [ ] Date filter 正確影響 Dashboard
* [ ] Game-day heatmap 正確
* [ ] Player detail route 可開啟
* [ ] Player metrics 正確
* [ ] Max drawdown 正確
* [ ] Winning / losing streak 正確
* [ ] Bust count 正確
* [ ] Sessions page 正確
* [ ] Session expandable rows 正確
* [ ] WARNING records 沒有被排除或修改
* [ ] Desktop responsive
* [ ] Mobile responsive
* [ ] No NaN / Infinity
* [ ] 無 console errors
* [ ] Unit tests pass
* [ ] README 包含啟動方法
* [ ] README 包含 data refresh 方法
* [ ] 不使用 mock statistics
* [ ] 不 hard-code 玩家戰績
* [ ] 不 hard-code玩家名單

---

# 79. V1.1 / Future Features

V1 完成後才考慮：

### Data Management

* Excel Upload
* drag & drop
* automatic validation
* data preview
* import history

### Game Config

* 不同日期 BB
* SB / BB config
* buy-in amount

### Social / Fun

* Player avatar
* badges
* monthly champion
* worst punt
* comeback king
* hot streak
* cold streak
* season awards

### Persistence

* Supabase / Postgres
* account
* login
* private room
* shareable room

### Advanced Poker Analytics

只有取得 hand-level data 後才做：

* VPIP
* PFR
* 3-bet
* WTSD
* W$SD
* player-vs-player transfer
* true head-to-head

---

# 80. Implementation Priority

Codex 應按照以下順序實作。

### Phase 1 — Data

1. 建立 types
2. 將 Clean_SessionResults 轉成 static JSON
3. Zod validation
4. metrics utilities
5. unit tests

### Phase 2 — Main Dashboard

6. Layout / theme
7. KPI cards
8. P&L leaderboard
9. BB/100 leaderboard
10. Equity curve
11. Date filter

### Phase 3 — Analysis

12. Heatmap
13. Player detail
14. Player equity curve
15. Advanced stats

### Phase 4 — Sessions

16. Sessions page
17. Filters
18. Expandable session rows

### Phase 5 — Polish

19. Responsive
20. Empty states
21. Loading behavior if necessary
22. Accessibility
23. README
24. Final numerical verification

---

# 81. Instruction to Codex

Implement this PRD as a complete working application.

Important constraints:

1. **Do not use mock data.**
2. Use the supplied Excel workbook's `Clean_SessionResults` sheet as the sole source of poker performance data.
3. Convert it to static JSON for runtime use.
4. Do not calculate statistics from legacy sheets.
5. Include WARNING records exactly like normal records.
6. Do not modify records to force zero-sum.
7. BB = NT$5.
8. All metrics must be derived in reusable utility functions rather than hard-coded.
9. All player names and dates must be data-driven.
10. Total P&L and BB/100 must match the acceptance values in this PRD.
11. Prioritize a polished visual hierarchy rather than a generic component-library demo.
12. The visual direction is a premium dark financial dashboard with understated poker character.
13. Complete desktop and mobile responsive behavior.
14. Add unit tests for metric calculations.
15. Include a README with setup and data refresh instructions.

Before considering implementation complete, verify the dashboard against the acceptance dataset numbers listed above.
