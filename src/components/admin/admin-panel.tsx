"use client";

import { useEffect, useState } from "react";
import { Check, FileUp, History, LogOut, RotateCcw, ShieldCheck } from "lucide-react";

interface Summary {
  recordCount: number;
  warningCount: number;
  playerCount: number;
  gameDateStart: string | null;
  gameDateEnd: string | null;
}

interface ImportVersion {
  id: string;
  created_at: string;
  published_at: string | null;
  status: "pending" | "published" | "superseded";
  original_file_name: string | null;
  record_count: number;
  warning_count: number;
  summary: Summary;
  source_version_id: string | null;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

async function getResponseBody(response: Response): Promise<Record<string, unknown>> {
  return response.json() as Promise<Record<string, unknown>>;
}

export function AdminPanel({ initialAuthenticated }: { initialAuthenticated: boolean }) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [versions, setVersions] = useState<ImportVersion[]>([]);
  const [pendingVersion, setPendingVersion] = useState<ImportVersion | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadVersions = async () => {
    const response = await fetch("/api/admin/imports", { cache: "no-store" });
    if (!response.ok) return;
    const body = await getResponseBody(response);
    setVersions((body.versions as ImportVersion[]) ?? []);
  };

  useEffect(() => {
    if (authenticated) void loadVersions();
  }, [authenticated]);

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = await getResponseBody(response);
      setMessage(String(body.error ?? "無法登入。"));
      return;
    }
    setPassword("");
    setAuthenticated(true);
  };

  const upload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    setMessage(null);
    setErrors([]);
    setPendingVersion(null);
    setSummary(null);
    const formData = new FormData();
    formData.set("file", file);
    const response = await fetch("/api/admin/imports", { method: "POST", body: formData });
    const body = await getResponseBody(response);
    setBusy(false);
    if (!response.ok) {
      setErrors((body.errors as ImportError[]) ?? []);
      setMessage(String(body.error ?? "Excel 驗證失敗。"));
      return;
    }
    setPendingVersion(body.version as ImportVersion);
    setSummary(body.summary as Summary);
    setMessage("驗證完成，確認摘要後即可發布。公開頁面尚未更新。");
    await loadVersions();
  };

  const publish = async () => {
    if (!pendingVersion) return;
    setBusy(true);
    const response = await fetch("/api/admin/imports/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId: pendingVersion.id }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = await getResponseBody(response);
      setMessage(String(body.error ?? "無法發布版本。"));
      return;
    }
    setPendingVersion(null);
    setMessage("已發布新版本，公開戰績頁已讀取更新後資料。");
    await loadVersions();
  };

  const selectPendingVersion = (version: ImportVersion) => {
    setPendingVersion(version);
    setSummary(version.summary);
    setMessage("已選取待發布版本，確認摘要後即可發布。");
  };

  const restore = async (version: ImportVersion) => {
    if (!window.confirm(`確定要回復 ${version.original_file_name ?? "此版本"} 的資料嗎？`)) return;
    setBusy(true);
    const response = await fetch("/api/admin/imports/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId: version.id }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = await getResponseBody(response);
      setMessage(String(body.error ?? "無法回復版本。"));
      return;
    }
    setMessage("已回復並發布指定版本的資料。");
    await loadVersions();
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setVersions([]);
    setPendingVersion(null);
  };

  if (!authenticated) {
    return (
      <main id="main-content" className="admin-shell">
        <form className="admin-login surface" onSubmit={login}>
          <ShieldCheck aria-hidden="true" size={22} />
          <div>
            <p className="section-kicker">ADMIN ACCESS</p>
            <h1>資料管理</h1>
            <p>登入後可匯入、發布與回復戰績版本。</p>
          </div>
          <label>
            共用密碼
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          </label>
          {message ? <p className="admin-message admin-error">{message}</p> : null}
          <button className="state-action" type="submit" disabled={busy}>{busy ? "驗證中" : "登入"}</button>
        </form>
      </main>
    );
  }

  return (
    <main id="main-content" className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">DATA OPERATIONS</p>
          <h1>戰績資料管理</h1>
          <p>只接受含有 Clean_SessionResults 工作表的 Excel 檔。</p>
        </div>
        <button className="icon-command" type="button" onClick={() => void logout()} title="登出" aria-label="登出"><LogOut size={17} /></button>
      </header>

      <section className="admin-section surface" aria-labelledby="upload-heading">
        <div className="section-heading">
          <div>
            <p className="section-kicker"><FileUp size={13} /> IMPORT</p>
            <h2 id="upload-heading">匯入新資料</h2>
            <p>資料通過檢查後才會建立待發布版本，不會立即影響公開戰績。</p>
          </div>
        </div>
        <form className="admin-upload-form" onSubmit={upload}>
          <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required />
          <button className="state-action" type="submit" disabled={!file || busy}>{busy ? "處理中" : "驗證 Excel"}</button>
        </form>
        {message ? <p className="admin-message">{message}</p> : null}
        {summary ? <div className="admin-summary" aria-label="匯入摘要">
          <span>{summary.recordCount} 筆紀錄</span><span>{summary.playerCount} 位玩家</span><span>{summary.warningCount} 筆 WARNING</span><span>{summary.gameDateStart} 至 {summary.gameDateEnd}</span>
        </div> : null}
        {errors.length > 0 ? <div className="admin-errors" role="alert">
          <strong>驗證失敗</strong>
          <ul>{errors.slice(0, 12).map((error) => <li key={`${error.row}-${error.field}`}>第 {error.row} 列，{error.field}：{error.message}</li>)}</ul>
          {errors.length > 12 ? <p>另有 {errors.length - 12} 項錯誤。</p> : null}
        </div> : null}
        {pendingVersion ? <button className="publish-command" type="button" onClick={() => void publish()} disabled={busy}>發布此版本</button> : null}
      </section>

      <section className="admin-section surface" aria-labelledby="history-heading">
        <div className="section-heading">
          <div>
            <p className="section-kicker"><History size={13} /> HISTORY</p>
            <h2 id="history-heading">版本紀錄</h2>
            <p>回復會建立並發布一個新的版本，既有紀錄不會被覆寫。</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead><tr><th>狀態</th><th>檔案</th><th>建立時間</th><th>紀錄</th><th>WARNING</th><th aria-label="操作" /></tr></thead>
            <tbody>{versions.map((version) => <tr key={version.id}>
              <td><span className={`version-status version-${version.status}`}>{version.status === "published" ? "目前發布" : version.status === "pending" ? "待發布" : "歷史版本"}</span></td>
              <td>{version.original_file_name ?? "由舊版回復"}</td><td>{new Date(version.created_at).toLocaleString("zh-TW")}</td><td>{version.record_count}</td><td>{version.warning_count}</td>
              <td>{version.status === "pending" ? <button className="icon-command" type="button" onClick={() => selectPendingVersion(version)} title="選取並發布此版本" aria-label="選取並發布此版本" disabled={busy}><Check size={16} /></button> : version.status === "superseded" ? <button className="icon-command" type="button" onClick={() => void restore(version)} title="回復此版本" aria-label="回復此版本" disabled={busy}><RotateCcw size={16} /></button> : null}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
