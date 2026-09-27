import type { Metadata } from "next";

import { GAME_CONFIG } from "@/config/game";

export const metadata: Metadata = {
  title: "指標說明",
  description: "Holdem Room 各項戰績、趨勢與風險指標的中文解釋。",
};

const metrics = [
  ["總損益", "選定期間內所有參與局次的損益加總。正數代表淨贏，負數代表淨輸。"],
  ["平均每局損益", "總損益除以實際參與局數，用來觀察每局平均表現。"],
  ["勝率", "獲利局數除以全部參與局數；和局也會計入總局數。"],
  ["每 100 局大盲注收益", `先以大盲注 NT$${GAME_CONFIG.bigBlind} 將損益換算成 BB，再換算成每 100 局的平均。這不是以實際手牌數計算的傳統 BB/100 hands。`],
  ["賺賠比", "所有獲利加總 ÷ 所有虧損的絕對值。大於 1 代表總獲利高於總虧損；沒有虧損時顯示 ∞。"],
  ["單局損益中位數", "將所有單局結果排序後取中間值，比平均值更不容易被少數極端大勝或大輸影響。"],
  ["單局波動", "使用樣本標準差衡量每局結果的起伏；數字越大，代表戰績波動越明顯。"],
  ["最大回撤", "從累積戰績歷史高點到之後最低點的最大跌幅，用來理解曾經歷的低潮深度。"],
  ["爆掉率", `單局損益小於或等於 NT$${Math.abs(GAME_CONFIG.bustThreshold)} 負值的次數，除以參與局數。`],
  ["近期戰力", "依每位玩家實際參與的最近 5、10 或 20 局計算，不會把缺席局次算入。"],
];

export default function MetricsPage() {
  return (
    <main className="info-page" id="main-content">
      <header className="info-hero"><div className="eyebrow">METRICS GUIDE</div><h1>指標說明</h1><p>每個數字代表什麼、怎麼計算，以及閱讀時需要注意的限制。</p></header>
      <section className="metric-guide-grid">
        {metrics.map(([title, description]) => <article className="surface metric-guide-card" key={title}><h2>{title}</h2><p>{description}</p></article>)}
      </section>
      <section className="surface info-section">
        <div className="section-kicker">RANKING RULES</div><h2>排行榜門檻</h2>
        <p>每 100 局收益榜與穩定獲利榜至少需要 {GAME_CONFIG.minBb100Sessions} 局。穩定獲利榜另外要求總損益為正，再依賺賠比排序。未達條件的玩家仍會顯示，但不給正式排名。</p>
      </section>
    </main>
  );
}
