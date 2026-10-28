import { ExamApp } from "@/components/exam-app";
import { SiteNav } from "@/components/site-nav";
import { examRouteHref, type ExamFilterOptions, type ExamRouteEntry } from "@/lib/exams";
import type { Dataset, ExamKind } from "@/lib/types";

interface Props {
  initialData: Dataset;
  filterOptions: ExamFilterOptions;
  initialFaculty: string;
  initialCurriculum: string;
  initialYear: string;
  initialKind: ExamKind;
  heading?: string;
  description?: string;
  internalLinks?: ExamRouteEntry[];
}

export function SchedulePage({
  heading = "ตารางสอบ KMITL",
  description = "ค้นหาตารางสอบกลางภาคและตารางสอบปลายภาค KMITL สำหรับนักศึกษา IT แยกตามคณะ หลักสูตร และชั้นปี",
  internalLinks,
  ...props
}: Props) {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main id="schedule" className="page-content mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-5 pb-10 sm:gap-5 sm:px-4 sm:py-6 sm:pb-12">
        <header className="text-center sm:py-3">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-xl font-bold text-accent-ink shadow-sm" aria-hidden="true">i</div>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-balance sm:text-4xl">{heading}</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-ink-2 sm:text-base">{description}</p>
        </header>
        <ExamApp {...props} />
        {internalLinks && (
          <details className="rounded-xl border border-line bg-surface p-4">
            <summary className="cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-accent">เลือกดูตารางสอบตามคณะและชั้นปี</summary>
            <nav aria-label="ลิงก์ตารางสอบรายคณะ" className="mt-3 grid gap-2 sm:grid-cols-2">
              {internalLinks.map((entry) => (
                <a key={`${entry.type}-${entry.faculty}-${entry.year}`} className="rounded-lg border border-line px-3 py-2 text-sm hover:border-accent hover:text-accent" href={examRouteHref(entry.type, entry.faculty, entry.year)}>
                  ตารางสอบ{entry.type === "final" ? "ปลายภาค" : "กลางภาค"} {entry.faculty} ปี {entry.year}
                </a>
              ))}
            </nav>
          </details>
        )}
      </main>
      <footer className="page-footer border-t border-line bg-surface px-4 py-6 text-center text-xs leading-5 text-ink-2">ข้อมูลตารางสอบจากระบบ REG KMITL · อัปเดตตามวันที่ระบุในหน้า</footer>
    </div>
  );
}
