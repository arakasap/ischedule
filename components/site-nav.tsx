"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";

export function SiteNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const isSchedulePage = pathname === "/";
  const isPersonalPage = pathname === "/my";

  const navLinkClass = (active: boolean) => [
    "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
    active ? "bg-accent-soft text-accent" : "hover:bg-accent-soft hover:text-accent",
  ].join(" ");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`site-nav page-nav ${scrolled ? "is-scrolled" : ""}`} aria-label="เมนูหลัก">
      <div className="site-nav-inner mx-auto flex w-full max-w-6xl items-center gap-2 px-3 sm:gap-4 sm:px-4">
        <a href="/" className="site-brand flex shrink-0 items-center gap-2 font-semibold" aria-label="กลับหน้าหลัก">
          <span className="site-brand-mark flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-ink">i</span>
          <span className="hidden text-sm tracking-tight sm:inline sm:text-base">&lt;i&gt;schedule</span>
        </a>
        <div className="flex items-center gap-1 text-sm text-ink-2 sm:ml-2 sm:gap-2">
          <a href="/" className={navLinkClass(isSchedulePage)} aria-current={isSchedulePage ? "page" : undefined}>ตารางสอบ</a>
          <a href="/my" className={navLinkClass(isPersonalPage)} aria-current={isPersonalPage ? "page" : undefined}>ของฉัน</a>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-sm text-ink-2 sm:gap-2">
          <AuthButton />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
