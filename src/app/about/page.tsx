import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Eye, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "關於我們",
  description: "了解 Holdem Room 的用途、設計原則與資料呈現方式。",
};

export default function AboutPage() {
  return (
    <main className="info-page" id="main-content">
      <header className="info-hero">
        <div className="eyebrow">ABOUT US</div>
        <h1>讓牌局紀錄變成看得懂的故事</h1>
        <p>Holdem Room 是為固定私人牌局打造的戰績整理工具，將逐局損益轉換成排行榜、趨勢、風險與近期狀態。</p>
      </header>
      <section className="info-card-grid">
        <InfoCard icon={<Eye size={20} />} title="容易理解">優先使用清楚的中文與說明，讓不熟悉統計術語的玩家也能讀懂。</InfoCard>
        <InfoCard icon={<BarChart3 size={20} />} title="忠於資料">所有結果都來自已匯入的逐局紀錄，不推測牌風、決策品質或未記錄的手牌資訊。</InfoCard>
        <InfoCard icon={<ShieldCheck size={20} />} title="公平比較">排行榜標示最低局數門檻與樣本不足狀態，避免少量資料造成誤導。</InfoCard>
      </section>
      <section className="surface info-section">
        <div className="section-kicker">WHAT YOU CAN DO</div>
        <h2>目前可以做什麼？</h2>
        <div className="info-columns">
          <ul><li>查看全期間與近期戰績</li><li>比較 2～4 位玩家</li><li>追蹤累積損益與回撤</li></ul>
          <ul><li>了解最新遊戲日重點</li><li>查看穩定度與賺賠比</li><li>回顧每一局的參與者與結果</li></ul>
        </div>
      </section>
      <div className="info-actions"><Link href="/" className="state-action">回到戰績總覽</Link><Link href="/metrics">查看指標說明</Link></div>
    </main>
  );
}

function InfoCard({ children, icon, title }: { children: ReactNode; icon: ReactNode; title: string }) {
  return <article className="surface info-card"><span>{icon}</span><h2>{title}</h2><p>{children}</p></article>;
}
