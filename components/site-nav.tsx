"use client";

import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`site-nav page-nav ${scrolled ? "is-scrolled" : ""}`} aria-label="เมนูหลัก">
      <div className="site-nav-inner mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4">
        <a href="/" className="site-brand flex shrink-0 items-center gap-2 font-semibold" aria-label="กลับหน้าหลัก">
          <span className="site-brand-mark flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-ink">i</span>
          <span className="text-sm tracking-tight sm:text-base">&lt;i&gt;schedule</span>
        </a>
        <div className="flex items-center gap-2 text-sm text-ink-2">
          <a href="#schedule" className="rounded-lg bg-accent-soft px-2.5 py-1.5 text-xs font-medium text-accent sm:px-3 sm:text-sm">ตารางสอบ</a>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
