export default function Loading() {
  return (
    <main className="dashboard-shell" id="main-content" aria-busy="true" aria-label="頁面載入中">
      <section className="page-state page-loading" role="status">
        <span className="loading-mark" aria-hidden="true" />
        正在載入戰績資料
      </section>
    </main>
  );
}
