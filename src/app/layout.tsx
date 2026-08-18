import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Spade } from "lucide-react";

import { PrimaryNav } from "@/components/layout/primary-nav";

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
        <a className="skip-link" href="#main-content">
          跳至主要內容
        </a>
        <header className="topbar">
          <div className="topbar-inner">
            <div className="brand">
              <span className="brand-mark" aria-hidden="true">
                <Spade size={18} strokeWidth={1.8} />
              </span>
              <span>Holdem Room</span>
            </div>
            <PrimaryNav />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
