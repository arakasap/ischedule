"use client";

import { ExamApp } from "@/components/exam-app";
import { SiteNav } from "@/components/site-nav";
import { useLanguage } from "@/components/language-provider";

export function SchedulePage() {
  const { language } = useLanguage();
  const english = language === "en";

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main id="schedule" className="page-content mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-5 pb-10 sm:gap-5 sm:px-4 sm:py-6 sm:pb-12">
        <header className="text-center sm:py-3">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-xl font-bold text-accent-ink shadow-sm">i</div>
          <p className="text-sm font-medium text-accent">&lt;i&gt;schedule · {english ? "For IT KMITL students" : "สำหรับนักศึกษา IT KMITL"}</p>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-balance sm:text-4xl">{english ? "Exam schedule & timeline" : "ตารางสอบ & ผังเวลาสอบ"}</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-ink-2 sm:text-base">
            {english ? "Find midterm and final exam dates by faculty, curriculum, and year, then view the full schedule in one place." : "ค้นหากำหนดการสอบกลางภาคและปลายภาค แยกตามคณะ หลักสูตร และชั้นปี แล้วดูภาพรวมตารางสอบได้ในหน้าเดียว"}
          </p>
        </header>
        <ExamApp />
      </main>
      <footer className="page-footer border-t border-line bg-surface px-4 py-6 text-center text-xs leading-5 text-ink-2">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p>{english ? "Built for IT KMITL · © 2026" : "สร้างสำหรับ IT KMITL · © 2026"} &lt;i&gt;schedule</p>
          <div className="flex flex-wrap justify-center gap-2">
            <a href="https://github.com/arakasap" target="_blank" rel="noreferrer" aria-label="GitHub /arakasap" className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[0.75rem] transition-colors hover:border-accent hover:text-accent">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M12 .7a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.4 11.4 0 0 1 6 0c2.29-1.55 3.29-1.23 3.29-1.23.65 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .7Z" /></svg>
              <span>/arakasap</span>
            </a>
            <a href="https://instagram.com/arakasap" target="_blank" rel="noreferrer" aria-label="Instagram @arakasap" className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[0.75rem] transition-colors hover:border-accent hover:text-accent">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" className="fill-current stroke-none" /></svg>
              <span>@arakasap</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
