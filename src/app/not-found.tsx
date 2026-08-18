import Link from "next/link";

export default function NotFound() {
  return (
    <main className="dashboard-shell" id="main-content">
      <section className="page-state">
        <div className="eyebrow">NOT FOUND</div>
        <h1>找不到這個頁面或玩家。</h1>
        <p>請從戰績總覽重新選擇玩家或局次。</p>
        <Link href="/" className="state-action">
          返回戰績總覽
        </Link>
      </section>
    </main>
  );
}
