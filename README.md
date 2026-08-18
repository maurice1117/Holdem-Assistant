# Holdem Assistant

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

基準資料包含 148 筆玩家局次紀錄、25 局、3 個遊戲日與 10 位玩家；BB 固定為 5。

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
