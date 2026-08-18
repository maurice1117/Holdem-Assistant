import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LayoutDashboard, ListOrdered, Spade } from "lucide-react";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "德州撲克戰績",
  description: "朋友間的 Poker Performance Dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant" className={`${geist.variable} ${geistMono.variable}`}>
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <div className="brand">
              <span className="brand-mark" aria-hidden="true">
                <Spade size={18} strokeWidth={1.8} />
              </span>
              <span>Holdem Room</span>
            </div>
            <nav className="primary-nav" aria-label="主要導覽">
              <span className="nav-item nav-item-active" aria-current="page">
                <LayoutDashboard size={16} />
                戰績總覽
              </span>
              <span className="nav-item nav-item-disabled" aria-disabled="true">
                <ListOrdered size={16} />
                每局紀錄
                <small>稍後</small>
              </span>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
