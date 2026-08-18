"use client";

import Link from "next/link";
import { LayoutDashboard, ListOrdered } from "lucide-react";
import { usePathname } from "next/navigation";

const navigationItems = [
  { href: "/", label: "戰績總覽", icon: LayoutDashboard },
  { href: "/sessions", label: "每局紀錄", icon: ListOrdered },
];

export function PrimaryNav() {
  const pathname = usePathname();

  return (
    <nav className="primary-nav" aria-label="主要導覽">
      {navigationItems.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            href={href}
            className={`nav-item${isActive ? " nav-item-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            key={href}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
