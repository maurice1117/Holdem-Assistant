# Holdem Assistant

朋友間德州撲克戰績 Dashboard。專案目前完成 PRD 的 Phase 1：資料匯出、Schema 驗證、統計工具與單元測試；網頁介面將於 Phase 2 實作。

## 環境需求

- Node.js 20 以上
- pnpm 11

## 執行步驟

1. 安裝相依套件：

   ```bash
   pnpm install
   ```

2. 執行 TypeScript 型別檢查：

   ```bash
   pnpm typecheck
   ```

3. 執行單元測試與資料驗收：

   ```bash
   pnpm test
   ```

4. 開發時若要持續監看測試：

   ```bash
   pnpm test:watch
   ```

## 資料來源

- 原始活頁簿：`data/戰積可查_清洗完成.xlsx`
- 唯一使用的工作表：`Clean_SessionResults`
- Runtime static JSON：`src/data/session-results.json`

目前基準資料包含 148 筆玩家局次紀錄、25 局、3 個遊戲日與 10 位玩家。`WARNING` 紀錄會保留原值並照常納入統計。

## Phase 1 主要檔案

- `src/types/poker.ts`：資料與統計型別
- `src/config/game.ts`：BB、排行榜門檻與爆掉門檻
- `src/lib/validation.ts`：Zod Schema 與重複資料偵測
- `src/lib/data.ts`：日期、玩家與局次資料整理
- `src/lib/metrics.ts`：P&L、BB/100、勝率、回撤、連勝敗等統計
