"use client";

import { useEffect, useMemo, useState } from "react";
import { ExamCountdown } from "@/components/exam-countdown";
import { ExamList } from "@/components/exam-list";
import { Segmented } from "@/components/segmented";
import { TimetableGrid } from "@/components/timetable-grid";
import { useLanguage } from "@/components/language-provider";
import { ALL, EXAM_KIND_LABEL, NO_CURRICULUM_LABEL, buildExamGroups, filterRows, groupByDate, thaiDate } from "@/lib/exam-utils";
import type { ExamFilterOptions } from "@/lib/exams";
import type { Dataset, ExamKind, ViewMode } from "@/lib/types";

interface Props {
  initialData: Dataset;
  filterOptions: ExamFilterOptions;
  initialFaculty: string;
  initialCurriculum: string;
  initialYear: string;
  initialKind: ExamKind;
}

const selectClass = "filter-select w-full min-w-0 rounded-xl border border-line bg-bg px-3 py-2.5 text-ink shadow-sm focus-visible:outline-2 focus-visible:outline-accent";

function yearLabel(year: number) {
  return year === 0 ? "ไม่ระบุชั้นปี (0)" : `ชั้นปี ${year}`;
}

export function ExamApp({ initialData, filterOptions, initialFaculty, initialCurriculum, initialYear, initialKind }: Props) {
  const { language } = useLanguage();
  const english = language === "en";
  const [data, setData] = useState(initialData);
  const [faculty, setFaculty] = useState(initialFaculty);
  const [curriculum, setCurriculum] = useState(initialCurriculum);
  const [year, setYear] = useState(initialYear);
  const [kind, setKind] = useState<ExamKind>(initialKind);
  const [view, setView] = useState<ViewMode>("grid");
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  const [error, setError] = useState<string | null>(null);
  const curriculums = filterOptions.curriculums[faculty] ?? [];
  const years = filterOptions.years[`${faculty}::${curriculum}`] ?? filterOptions.years[`${faculty}::__all__`] ?? [];
  const result = useMemo(() => buildExamGroups(filterRows(data.rows, faculty, curriculum, year), kind), [data, faculty, curriculum, year, kind]);
  const byDate = useMemo(() => groupByDate(result.scheduled), [result]);

  async function loadSelection(nextFaculty: string, nextCurriculum: string, nextYear: string, nextKind: ExamKind) {
    const params = new URLSearchParams({ faculty: nextFaculty, kind: nextKind });
    if (nextCurriculum !== ALL) params.set("curriculum", nextCurriculum);
    if (nextYear !== ALL) params.set("year", nextYear);
    const response = await fetch(`/api/exams?${params}`);
    if (!response.ok) throw new Error(`โหลดข้อมูลตารางสอบไม่สำเร็จ (HTTP ${response.status})`);
    setData(await response.json() as Dataset);
  }

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const queryFaculty = query.get("f");
    const nextFaculty = queryFaculty && filterOptions.faculties.includes(queryFaculty) ? queryFaculty : initialFaculty;
    const nextCurriculum = query.get("c") ?? initialCurriculum;
    const nextYear = query.get("y") ?? initialYear;
    const nextKind: ExamKind = query.get("k") === "midterm" ? "midterm" : initialKind;
    setFaculty(nextFaculty); setCurriculum(nextCurriculum); setYear(nextYear); setKind(nextKind);
    if (query.get("v") === "list") setView("list");
    if (nextFaculty !== initialFaculty || nextCurriculum !== initialCurriculum || nextYear !== initialYear || nextKind !== initialKind) {
      loadSelection(nextFaculty, nextCurriculum, nextYear, nextKind).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : String(cause)));
    }
  }, [filterOptions.faculties, initialCurriculum, initialFaculty, initialKind, initialYear]);

  useEffect(() => {
    const query = new URLSearchParams({ f: faculty, c: curriculum, y: year, k: kind, v: view });
    window.history.replaceState(null, "", `?${query}`);
  }, [curriculum, faculty, kind, view, year]);

  async function changeSelection(nextFaculty: string, nextCurriculum: string, nextYear: string, nextKind = kind) {
    setFaculty(nextFaculty); setCurriculum(nextCurriculum); setYear(nextYear); setKind(nextKind);
    try { await loadSelection(nextFaculty, nextCurriculum, nextYear, nextKind); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
  }

  async function copyText() {
    const lines = [`ตารางสอบ${EXAM_KIND_LABEL[kind]} ภาคเรียน ${data.meta.term}`, [faculty, curriculum === ALL ? "ทุกหลักสูตร" : curriculum, year === ALL ? "ทุกชั้นปี" : yearLabel(Number(year))].join(" | "), ""];
    byDate.forEach((groups, date) => { lines.push(thaiDate(date)); groups.forEach((group) => lines.push(`  ${group.code} ${group.name} ${group.info.label}`)); });
    try { await navigator.clipboard.writeText(lines.join("\n")); setCopied("ok"); } catch { setCopied("fail"); }
    window.setTimeout(() => setCopied("idle"), 1800);
  }

  if (error) return <div role="alert" className="rounded-xl border border-line bg-surface p-4 text-sm">{error}</div>;
  const termLabel = `ภาคเรียนที่ ${data.meta.term.replace("/", " ปีการศึกษา ")}`;
  const kindLabel = EXAM_KIND_LABEL[kind];

  return <>
    <section aria-labelledby="filter-title" className="surface-lift overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="border-b border-line bg-accent-soft px-4 py-4 sm:px-5"><h2 id="filter-title" className="font-semibold">{english ? "Find an exam schedule" : "ค้นหาตารางสอบ"}</h2><p className="mt-1 text-sm text-ink-2">{english ? "Choose your details to show relevant subjects" : "เลือกคณะ หลักสูตร ชั้นปี และประเภทการสอบ"}</p></div>
      <div className="grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
        <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-ink-2">คณะ / หน่วยงาน<select className={selectClass} value={faculty} onChange={(event) => changeSelection(event.target.value, ALL, ALL)}>{filterOptions.faculties.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-ink-2">หลักสูตรหรือสาขา<select className={selectClass} value={curriculum} onChange={(event) => changeSelection(faculty, event.target.value, year)}><option value={ALL}>ทุกหลักสูตรในคณะนี้</option>{curriculums.map((item) => <option key={item} value={item}>{item || NO_CURRICULUM_LABEL}</option>)}</select></label>
        <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-ink-2">ชั้นปี<select className={selectClass} value={year} onChange={(event) => changeSelection(faculty, curriculum, event.target.value)}><option value={ALL}>ทุกชั้นปี</option>{years.map((item) => <option key={item} value={String(item)}>{yearLabel(item)}</option>)}</select></label>
        <div className="sm:col-span-3"><Segmented label="การสอบ" value={kind} onChange={(value) => changeSelection(faculty, curriculum, year, value)} options={[{ value: "midterm", label: "สอบกลางภาค" }, { value: "final", label: "สอบปลายภาค" }]} /></div>
        <div className="sm:col-span-3"><Segmented label="มุมมอง" value={view} onChange={setView} options={[{ value: "grid", label: "ตารางตามเวลา" }, { value: "list", label: "รายการ" }]} /></div>
      </div>
    </section>
    <div className="surface-lift flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm"><span className="font-medium">ตารางสอบ{kindLabel}</span><span className="text-ink-2"><b className="tabular-nums text-ink">{new Set(result.scheduled.map((group) => group.code)).size}</b> วิชา</span><span>{termLabel}</span><button type="button" onClick={copyText} className="ml-auto cursor-pointer rounded-md border border-line bg-surface px-3 py-1.5 text-[0.85rem] hover:border-accent">{copied === "ok" ? "คัดลอกแล้ว" : copied === "fail" ? "คัดลอกไม่ได้" : "คัดลอกตาราง"}</button></div>
    <ExamCountdown groups={result.scheduled} spotlight={false} />
    {result.scheduled.length === 0 ? <div className="rounded-xl border border-line bg-surface px-4 py-10 text-center text-ink-2">ยังไม่พบตารางสอบสำหรับตัวเลือกนี้</div> : view === "grid" ? <TimetableGrid groups={result.scheduled} byDate={byDate} banner={[`คณะ${faculty.replace(/^คณะ/, "")}`, curriculum === ALL ? "ทุกหลักสูตร" : curriculum, `${year === ALL ? "ทุกชั้นปี" : yearLabel(Number(year))} · ${termLabel} · สอบ${kindLabel}`]} /> : <ExamList byDate={byDate} />}
    <div className="rounded-lg bg-warn-soft px-3.5 py-2.5 text-[0.85rem] text-warn-ink"><b className="font-semibold">หมายเหตุ:</b> ข้อมูลนี้เป็นภาพรวมจากระบบ REG KMITL ไม่ใช่รายวิชาที่ลงทะเบียนจริง กรุณาตรวจสอบกับประกาศของคณะก่อนเข้าสอบ</div>
    <footer className="text-[0.8rem] text-ink-2">อัปเดตล่าสุด {data.meta.fetchedAt} · แหล่งข้อมูล {data.meta.source}</footer>
  </>;
}
