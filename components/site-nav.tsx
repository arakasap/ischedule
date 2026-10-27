"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";

export function SiteNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const { language } = useLanguage();
  const english = language === "en";
  const isSchedulePage = pathname === "/";
  const isPersonalPage = pathname === "/my";

  const navLinkClass = (active: boolean) => [
    "nav-link inline-flex h-10 w-28 items-center justify-center rounded-xl px-3 py-2 text-center text-xs font-medium transition-[background-color,color,transform] duration-200 sm:text-sm",
    active ? "bg-accent-soft text-accent" : "hover:bg-accent-soft hover:text-accent",
  ].join(" ");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  return (
    <nav ref={navRef} className={`site-nav page-nav ${scrolled ? "is-scrolled" : ""}`} aria-label="เมนูหลัก">
      <div className="site-nav-inner mx-auto flex w-full max-w-6xl items-center gap-2 px-3 sm:gap-4 sm:px-4">
        <a href="/" className="site-brand flex shrink-0 items-center gap-2 font-semibold" aria-label="กลับหน้าหลัก">
          <span className="site-brand-mark flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-ink">i</span>
          <span className="hidden text-sm tracking-tight sm:inline sm:text-base">&lt;i&gt;schedule</span>
        </a>
        <div id="site-navigation-links" className={`nav-links ${menuOpen ? "is-open" : ""}`}>
          <a href="/?view=schedule" onClick={() => setMenuOpen(false)} className={navLinkClass(isSchedulePage)} aria-current={isSchedulePage ? "page" : undefined}>{english ? "Exam schedule" : "ตารางสอบ"}</a>
          <a href="/my" onClick={() => setMenuOpen(false)} className={navLinkClass(isPersonalPage)} aria-current={isPersonalPage ? "page" : undefined}>{english ? "My schedule" : "ของฉัน"}</a>
          <div className="mobile-menu-account">
            <AuthButton />
          </div>
          <div className="mobile-menu-language">
            <LanguageToggle />
          </div>
        </div>
        <div className="nav-actions ml-auto flex items-center gap-1.5 text-sm text-ink-2 sm:gap-2">
          <div className="desktop-auth">
            <AuthButton />
          </div>
          <div className="desktop-language">
            <LanguageToggle />
          </div>
          <ThemeToggle />
          <button
            type="button"
            className="mobile-menu-toggle inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink-2 transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
            aria-controls="site-navigation-links"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round">
              {menuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
