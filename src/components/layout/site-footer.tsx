import Link from "next/link";
import { Spade } from "lucide-react";

const featureLinks = [
  { href: "/", label: "戰績總覽" },
  { href: "/sessions", label: "每局紀錄" },
  { href: "/compare", label: "玩家比較" },
];

const informationLinks = [
  { href: "/metrics", label: "指標說明" },
  { href: "/about", label: "關於我們" },
  { href: "/data-policy", label: "資料與免責聲明" },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <span className="brand-mark" aria-hidden="true"><Spade size={17} strokeWidth={1.8} /></span>
          <div>
            <strong>Holdem Room</strong>
            <p>讓私人牌局的戰績更容易理解。</p>
          </div>
        </div>
        <FooterLinks title="功能" links={featureLinks} />
        <FooterLinks title="說明" links={informationLinks} />
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Holdem Room</span>
        <span>僅供私人牌局紀錄與統計分析</span>
      </div>
    </footer>
  );
}

function FooterLinks({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <nav className="footer-links" aria-label={title}>
      <strong>{title}</strong>
      {links.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
    </nav>
  );
}
