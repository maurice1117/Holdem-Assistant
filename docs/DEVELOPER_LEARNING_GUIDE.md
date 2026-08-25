# Holdem Assistant 開發學習指南

這份指南以 Holdem Assistant 的實際程式碼為教材，目標不是背誦技術名詞，而是理解資料如何流過系統、如何驗證結果，以及發生問題時如何定位原因。

## 目前專案技術棧

- Next.js 16（App Router）
- React 19
- TypeScript
- Zod
- Recharts
- Vitest
- Tailwind CSS
- pnpm

目前專案沒有後端 API、資料庫、登入或權限系統。現階段應優先掌握既有的靜態資料架構，不必急著學習尚未使用的技術。

## 專案資料流

```text
Excel
  → 靜態 JSON
  → Zod 驗證
  → Next.js 頁面
  → React Dashboard
  → 指標計算
  → Recharts 圖表與排行榜
  → Vitest 驗證結果
```

---

## 第一階段：能說明專案怎麼運作

### 第 1 題：畫出資料旅行路線

研究並回答：

1. `session-results.json` 是在哪裡被 import？
2. 資料在哪一刻經過 Zod 驗證？
3. 驗證後如何傳進 Dashboard？
4. 日期篩選後，哪些函式重新計算？
5. 最後如何變成圖表上的一個點？

建議追蹤：

- `src/data/index.ts`
- `src/app/page.tsx`
- `src/components/dashboard/dashboard.tsx`
- `src/lib/metrics.ts`
- `src/components/charts/equity-chart.tsx`

**完成標準：** 不看程式碼，也能用自己的話畫出完整流程圖。

### 第 2 題：哪些程式跑在伺服器？哪些跑在瀏覽器？

研究並回答：

1. `"use client"` 的功能是什麼？
2. 為什麼 `page.tsx` 沒有 `"use client"`？
3. 為什麼 Dashboard 必須是 Client Component？
4. `useState` 和點擊事件能不能存在 Server Component？
5. 圖表為什麼透過 `dynamic(..., { ssr: false })` 載入？
6. Server Component 將資料傳給 Client Component 時，有哪些序列化限制？

建議閱讀：

- `src/app/page.tsx`
- `src/components/dashboard/dashboard.tsx`
- `src/components/charts/equity-chart-shell.tsx`

**實作挑戰：** 暫時移除 `ssr: false`，觀察開發模式和正式建置是否出現差異，再解釋原因。完成實驗後還原程式。

---

## 第二階段：掌握 TypeScript 與資料安全

### 第 3 題：TypeScript interface 和 Zod 有什麼不同？

專案同時存在 `SessionResult` interface 與 `sessionResultSchema`。研究並回答：

1. TypeScript 能不能阻止 JSON 裡出現 `"pnl": "100"`？
2. interface 在程式執行後還存在嗎？
3. 為什麼外部資料不能只使用 `as SessionResult[]`？
4. `unknown` 為什麼比 `any` 安全？
5. Zod 驗證失敗時，網站會在哪一層出錯？
6. Compile-time type checking 和 runtime validation 各自保護什麼？

建議閱讀：

- `src/types/poker.ts`
- `src/lib/validation.ts`
- `src/lib/validation.test.ts`

**實作挑戰：** 複製一筆資料，分別製造以下錯誤並記錄結果：

- 不存在的日期 `2026-02-30`
- `pnl` 變成字串
- 空白玩家名稱
- 重複的玩家局次
- `session_number` 變成小數

完成實驗後還原資料。

### 第 4 題：為什麼日期字串可以直接比較？

目前日期篩選直接比較 `YYYY-MM-DD` 字串。研究並回答：

1. 為什麼 `YYYY-MM-DD` 可以按字串排序？
2. 如果改成 `MM/DD/YYYY` 還成立嗎？
3. JavaScript `Date`、本地時區與 UTC 有哪些常見陷阱？
4. `2026-2-5` 和 `2026-02-05` 有何差異？
5. 日期範圍目前是否包含開始日和結束日？

建議閱讀：

- `src/lib/data.ts`
- `src/lib/validation.ts`

**實作挑戰：** 替日期篩選新增三個邊界測試，包括首日、末日和跨月份。

---

## 第三階段：理解 React 的資料模型

### 第 5 題：state、props、衍生資料有什麼不同？

以 Dashboard 為例，分類以下資料：

- `records`
- `selectedDate`
- `selectedPlayers`
- `gameDates`
- `pnlLeaderboard`
- `curve`

研究並回答：

1. 哪些是 props？
2. 哪些需要 state？
3. 哪些能從其他資料推導，不該另外存成 state？
4. 如果同時把 `records` 和 `filteredRecords` 儲存為 state，可能發生什麼不同步問題？
5. 使用陣列作為 state 時，為什麼不應直接 `push()`？

### 第 6 題：這裡的 `useMemo` 到底需不需要？

研究並回答：

1. `useMemo` 是正確性工具還是效能工具？
2. dependency array 少放 `selectedDate` 會怎樣？
3. dependency 放入每次 render 都重新建立的 object 會怎樣？
4. 只有 148 筆資料時，是否真的需要每一處都 memo？
5. `selectedPlayers` 改變時，為什麼排行榜不用重算？
6. 過度使用 `useMemo` 有什麼成本？

建議閱讀：

- `src/components/dashboard/dashboard.tsx`

**實作挑戰：** 移除一個 `useMemo`，利用 `console.count()` 觀察重新計算次數。記錄結果後還原程式。

---

## 第四階段：掌握商業邏輯

### 第 7 題：親手算出一位玩家的所有指標

挑一位玩家，手動計算：

- Total P&L
- BB/100
- 勝率
- Best Session
- Worst Session
- Current Drawdown
- Max Drawdown
- 最長連勝與連敗
- 樣本標準差
- Bust Count

研究並回答：

1. 為什麼標準差除以 `n - 1` 而不是 `n`？
2. 為什麼 drawdown 的初始高點是 0？
3. P&L 相同時，排行榜為什麼會出現 `1, 2, 2, 4`？
4. 玩家沒有參加某局時，累積曲線為什麼要延續，而不是歸零？
5. `playedSessions === 0` 時，為什麼比例回傳 `null` 而不是 0？

建議閱讀：

- `src/config/game.ts`
- `src/lib/metrics.ts`
- `src/lib/metrics.test.ts`

**完成標準：** 能從產品規則推導公式，而不只是逐行解釋程式語法。

### 第 8 題：純函式為什麼比較好測？

研究並回答：

1. 什麼是 pure function？
2. `getPlayerStats(records, player)` 為什麼接收資料，而不是直接 import JSON？
3. 如果函式內直接讀取 React state，測試會變難在哪裡？
4. `sort()` 是否會修改原陣列？
5. 專案哪些地方先使用 `[...records]` 複製？為什麼？

**實作挑戰：** 新增「每日平均 P&L」函式及至少四個測試，先不要修改 React 畫面。

---

## 第五階段：測試與除錯

### 第 9 題：單元測試和驗收測試差在哪裡？

目前 `metrics.test.ts` 同時包含小型人工資料測試與完整資料集驗收測試。研究並回答：

1. 哪一種比較容易指出錯誤原因？
2. 哪一種可以防止 Excel 轉換時漏資料？
3. 測試實作細節和測試行為有何差別？
4. `toBe()`、`toEqual()`、`toMatchObject()`、`toBeCloseTo()` 如何選擇？
5. 測試全部通過，是否代表 UI 一定正確？
6. 哪些錯誤適合單元測試，哪些適合瀏覽器測試？

**實作挑戰：** 暫時把 BB 從 5 改成 10，執行測試，判斷哪些測試理應失敗、哪些不該受影響。完成後還原設定。

### 第 10 題：建立自己的除錯決策樹

遇到「網站壞了」時，不要直接修改程式。先依序分類：

```text
環境問題？
  → 依賴安裝問題？
  → 編譯／型別錯誤？
  → Runtime 錯誤？
  → 資料驗證錯誤？
  → 商業邏輯錯誤？
  → React 狀態錯誤？
  → CSS／顯示問題？
```

真實案例：在非互動執行環境中執行 `test`、`typecheck`、`build`，三者都可能在真正執行專案程式前，就被 pnpm 的環境或依賴檢查擋住。

研究並回答：

1. 為什麼這不能直接推論「測試壞了」？
2. process exit code 是什麼？
3. stack trace 應該如何閱讀？
4. CI 環境和本機互動式終端機有何差異？
5. `node_modules`、lockfile、Node.js 與 pnpm 版本不一致會造成什麼問題？
6. 如何設計最小實驗，判斷問題位於環境還是程式碼？

**完成標準：** 寫一份 incident note，包含症狀、重現方式、假設、實驗、證據與結論。

---

## 最終 Boss 題：實作玩家詳細頁

實作一個 `/players/[playerSlug]` 玩家詳細頁，但不要讓 AI 一次生成全部。開始寫程式前，先完成以下設計：

1. 說明 Next.js 動態路由如何運作。
2. 解釋中文玩家名稱如何安全放入 URL。
3. 決定資料計算應放在 page、component 還是 `metrics.ts`，並說明理由。
4. 設計不存在玩家的處理方式。
5. 顯示 P&L、BB/100、勝率及單人累積曲線。
6. 為新增的資料函式撰寫測試。
7. 驗證 typecheck、test 和 production build。
8. 故意製造一個錯誤，完整記錄除錯過程。

**完成標準：** 不只讓功能可以使用，也能逐項解釋路由、資料流、狀態、測試和錯誤處理的設計原因。

---

## 建議學習方式

每一題都按照同一個循環進行：

1. **先預測：** 不查資料，先寫下你認為程式會怎麼運作。
2. **查證：** 優先查官方文件，再閱讀專案中的實際用法。
3. **做小實驗：** 一次只改一個變因，記錄輸入、操作和輸出。
4. **解釋結果：** 用自己的話寫下 100～300 字結論。
5. **請 AI 審查：** 提供你的答案和證據，請 AI 指出觀念錯誤，不要只索取標準答案。
6. **隔天重述：** 不看筆記，再解釋一次；說不清楚的部分就是下一輪複習重點。

### 每題學習紀錄模板

```markdown
# 題目

## 我的預測

## 查到的資料

## 實驗步驟

## 實際結果

## 為什麼會這樣

## 我原本理解錯誤的地方

## 下次遇到類似問題的排查步驟
```

## 建議順序

不要同時研究所有題目。建議每次完成一題：

1. 第 1～2 題：掌握整體架構與執行位置。
2. 第 3～4 題：掌握型別、驗證與資料格式。
3. 第 5～6 題：掌握 React 資料與重新渲染。
4. 第 7～8 題：掌握商業邏輯與純函式。
5. 第 9～10 題：掌握測試與系統化除錯。
6. 最終 Boss 題：整合所有知識完成真實功能。

真正掌握一個技術，不是「看得懂 AI 寫的程式」，而是能預測修改後會發生什麼、能設計方法驗證預測，也能在預測錯誤時找出原因。
