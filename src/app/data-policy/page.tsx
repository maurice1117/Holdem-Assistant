import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "資料與免責聲明",
  description: "Holdem Room 的資料來源、計算範圍與使用限制。",
};

export default function DataPolicyPage() {
  return (
    <main className="info-page" id="main-content">
      <header className="info-hero"><div className="eyebrow">DATA & DISCLAIMER</div><h1>資料與免責聲明</h1><p>了解網站呈現哪些資料，以及這些統計不代表什麼。</p></header>
      <div className="info-stack">
        <PolicySection title="資料來源">網站結果來自管理者匯入並發布的牌局紀錄，包括日期、局次、玩家、是否參與及單局損益。網站不會從現有資料推測底牌、位置或下注行為。</PolicySection>
        <PolicySection title="資料品質">標示為警告的匯入紀錄仍會納入統計。若原始紀錄有缺漏、姓名不一致或金額輸入錯誤，相關排行榜與圖表也會受到影響。</PolicySection>
        <PolicySection title="統計限制">目前沒有實際手牌數與遊玩時間，因此「每 100 局大盲注收益」不是傳統撲克軟體使用的 BB/100 hands，也無法計算時薪、VPIP、PFR 或 All-in EV。</PolicySection>
        <PolicySection title="使用聲明">本網站僅供私人牌局紀錄、娛樂與統計分析，不構成投資、財務、博弈或策略建議。短期結果可能受到運氣與樣本數影響，不應被視為未來表現保證。</PolicySection>
        <PolicySection title="資料修正">若發現戰績或玩家名稱有誤，請由管理者修正來源資料後重新發布；前台圖表會以最新發布版本重新計算。</PolicySection>
      </div>
    </main>
  );
}

function PolicySection({ children, title }: { children: ReactNode; title: string }) {
  return <section className="surface info-section"><h2>{title}</h2><p>{children}</p></section>;
}
