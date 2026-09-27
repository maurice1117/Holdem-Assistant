# Holdem Assistant

## 資料更新與 Excel 格式

正式環境請由 `/admin` 匯入 Excel。驗證通過後，按「發布此版本」才會更新公開戰績；每次匯入都會保留版本，必要時可從版本紀錄回復。

### Excel 格式

- 檔案格式：`.xlsx`，上限 10 MB。
- 工作表名稱必須是 `Clean_SessionResults`。
- 第一列必須為欄位名稱；不支援自行對應欄名。
- 每列代表一位玩家在一局中的結果。`WARNING` 紀錄必須原樣保留，不能為了平衡損益而修改。

| 欄位 | 必填 | 格式與限制 | 範例 |
| --- | --- | --- | --- |
| `game_date` | 是 | 有效日期，`YYYY-MM-DD` 或 Excel 日期儲存格 | `2026-08-15` |
| `session_number` | 是 | 大於 0 的整數；同一天從 1 起編號 | `3` |
| `player_name` | 是 | 非空白玩家名稱 | `大舅哥` |
| `pnl` | 是 | 有限數值，可為正、負或 0 | `-250` |
| `participated` | 是 | `TRUE` 或 `FALSE` | `TRUE` |
| `source_sheet` | 否 | 原始工作表名稱 | `260815` |
| `source_row` | 否 | 原始資料列號，正整數 | `12` |
| `session_status` | 否 | `VALID` 或 `WARNING` | `WARNING` |

最小範例：

| game_date | session_number | player_name | pnl | participated | source_sheet | source_row | session_status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-08-15 | 1 | 大舅哥 | 150 | TRUE | 260815 | 2 | VALID |
| 2026-08-15 | 1 | 強的可怕 | -150 | TRUE | 260815 | 2 | WARNING |

### 匯入限制與流程

1. `game_date`、`session_number`、正規化後的 `player_name` 組合不可重複。
2. `Kai` 會正規化為「大舅哥」；兩個名稱若出現在同一天、同一局，匯入會被拒絕。
3. 前往 `/admin`，上傳 Excel，依畫面修正所有錯誤後確認資料摘要。
4. 按「發布此版本」更新公開頁面；若要退回，從版本紀錄選取歷史版本的回復按鈕。

首次啟用 Supabase、Vercel 環境變數與密碼設定，請參閱 [管理端資料匯入說明](docs/admin-import.md)。

朋友間德州撲克戰績儀表板，將每局的玩家損益整理成可篩選的戰績總覽、排行與個人分析頁。

## 已完成功能

### Phase 1：資料與統計層

- 讀取靜態 JSON 資料，並以 Zod 驗證資料格式與重複紀錄。
- 提供 P&L、BB/100、勝率、平均損益、回撤、連勝／連敗與爆掉次數等統計。
- 保留 `WARNING` 紀錄原始數值，並照常納入統計。

### Phase 2：戰績總覽

- 全站日期篩選與核心 KPI。
- 玩家累積 P&L 曲線。
- 總 P&L 與 BB/100 排行榜，並標示樣本不足的玩家。

### Phase 3：玩家分析

- 遊戲日／玩家熱圖，可快速比較每天的損益。
- 從排行榜與熱圖直接進入玩家個人頁。
- 個人累積 P&L、每日 P&L 圖表與主要戰績指標。
- 進階統計：高點、目前／最大回撤、標準差、連勝／連敗、爆掉次數。
- 可篩選、排序的玩家局次紀錄。

### Phase 4：每局紀錄

- `/sessions` 每局紀錄頁，可依遊戲日期與玩家篩選。
- 每局顯示參與人數、最大贏家與最大輸家，並可展開同桌所有玩家的 P&L。
- 展開明細中的玩家名稱可直接進入個人分析頁。
- `Kai` 的歷史紀錄會在 runtime 合併到「大舅哥」，原始 JSON 保持不變。

## 環境需求

- Node.js 22 以上
- pnpm 11

## 執行步驟

### Windows 首次設定

如果 PowerShell 無法辨識 `node` 或 `pnpm`，先執行：

```powershell
winget install -e --id OpenJS.NodeJS.LTS
winget install -e --id pnpm.pnpm
```

安裝完成後，重新開啟 PowerShell，再確認版本：

```powershell
node --version
pnpm --version
```

若電腦沒有 `winget`，可改從 [Node.js 官方網站](https://nodejs.org/en/download/) 安裝 LTS 版，再依 [pnpm 官方安裝說明](https://pnpm.io/installation) 安裝 pnpm。

### 啟動與驗證

```bash
pnpm install
pnpm dev
```

在瀏覽器開啟 `http://localhost:3000`。

```bash
pnpm typecheck
pnpm test
pnpm build
```

開發時若要持續監看測試：

```bash
pnpm test:watch
```

## 資料來源

- 原始活頁簿：`data/戰積可查_清洗完成.xlsx`
- 唯一使用的工作表：`Clean_SessionResults`
- Runtime static JSON：`src/data/session-results.json`

基準資料包含 332 筆玩家局次紀錄、58 局、6 個遊戲日與 14 位玩家；BB 固定為 5。

### 更新資料

1. 僅從原始活頁簿的 `Clean_SessionResults` 工作表匯出資料，並更新 `src/data/session-results.json`。
2. 每筆資料需保留 `game_date`、`session_number`、`player_name`、`pnl`、`participated`；`source_sheet`、`source_row` 與 `session_status` 可保留作為資料血緣。
3. 不要排除或修改 `WARNING` 紀錄，也不要為了平衡損益修改數值。
4. 執行 `pnpm test`、`pnpm typecheck` 與 `pnpm build`。測試會驗證資料格式、重複紀錄、局次數量與主要統計。

目前的資料展示層會將別名 `Kai` 合併至「大舅哥」，但來源 JSON 中的原始名稱保持不變。

## 主要程式位置

- `src/lib/data.ts`：日期、玩家、局次與遊戲日資料整理
- `src/lib/metrics.ts`：統計計算
- `src/components/dashboard/`：總覽、排行榜與熱圖
- `src/app/players/[playerSlug]/page.tsx`：玩家個人頁路由
- `src/components/players/player-detail.tsx`：玩家個人分析頁
- `src/components/charts/`：總覽與玩家圖表
- `src/app/sessions/page.tsx`：每局紀錄路由
- `src/components/sessions/sessions-page.tsx`：每局紀錄與篩選互動
