# 管理端資料匯入

## 一次性設定

1. 在 Supabase SQL Editor 執行 `supabase/migrations/202608180001_import_versions.sql`。
2. 產生共用密碼雜湊：`pnpm admin:password-hash <password>`。
3. 以 `.env.example` 建立本機 `.env.local`，填入 Supabase URL、Service Role Key、密碼雜湊與長隨機 Cookie 密鑰。
4. 在 Vercel Production 環境變數中設定相同四個值後重新部署。

`SUPABASE_SERVICE_ROLE_KEY` 只可出現在伺服器環境變數，不能使用 `NEXT_PUBLIC_` 前綴。

## 日常流程

1. 開啟 `/admin` 並以共用密碼登入。
2. 上傳 `.xlsx`，檔案必須含有 `Clean_SessionResults` 工作表及五個必要欄位：`game_date`、`session_number`、`player_name`、`pnl`、`participated`。
3. 修正頁面列出的驗證錯誤，直到出現資料摘要。
4. 按「發布此版本」後公開頁面會讀取新資料。
5. 需要退回時，在版本紀錄選取歷史版本的回復按鈕；系統會建立並發布新的回復版本。

原始 Excel 儲存在私有 `session-imports` bucket；公開使用者不能直接取得檔案或資料庫紀錄。
