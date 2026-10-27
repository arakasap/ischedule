"use client";

import { useLanguage } from "@/components/language-provider";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  const english = language === "en";

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={english ? "Switch to Thai" : "เปลี่ยนเป็นภาษาอังกฤษ"}
      aria-pressed={english}
      title={english ? "Switch to Thai" : "เปลี่ยนเป็นภาษาอังกฤษ"}
      className="language-toggle nav-action-button inline-flex h-10 items-center gap-0.5 rounded-xl border border-line px-1.5 text-[0.7rem] font-semibold text-ink-2 transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className={`rounded-md px-1.5 py-1 transition-colors ${!english ? "bg-accent text-accent-ink" : ""}`}>TH</span>
      <span className={`rounded-md px-1.5 py-1 transition-colors ${english ? "bg-accent text-accent-ink" : ""}`}>EN</span>
    </button>
  );
}
