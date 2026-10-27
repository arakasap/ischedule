"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthButton } from "@/components/auth-button";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import { ExamCountdown } from "@/components/exam-countdown";
import { ExamList } from "@/components/exam-list";
import { TimetableGrid } from "@/components/timetable-grid";
import { buildExamGroups, groupByDate } from "@/lib/exam-utils";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Dataset, ExamKind, Offering } from "@/lib/types";

const STORAGE_KEY = "ischedule-my-course-codes";

export function MyScheduleApp() {
  const { user, loading: authLoading, error: authError } = useAuth();
  const { language } = useLanguage();
  const english = language === "en";
  const [rows, setRows] = useState<Offering[]>([]);
  const [codes, setCodes] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [kind, setKind] = useState<ExamKind>("final");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scheduleHydrated, setScheduleHydrated] = useState(false);

  useEffect(() => {
    fetch("/data/exams.json")
      .then(async (response) => {
        if (!response.ok) throw new Error("โหลดข้อมูลตารางสอบไม่สำเร็จ");
        return response.json() as Promise<Dataset>;
      })
      .then((data) => setRows(data.rows))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) {
      setScheduleHydrated(false);
      return;
    }

    const savedFromAccount = user.user_metadata?.ischedule_course_codes;
    if (Array.isArray(savedFromAccount)) {
      setCodes(savedFromAccount.filter((value): value is string => typeof value === "string").slice(0, 30));
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem(`${STORAGE_KEY}:${user.id}`) ?? localStorage.getItem(STORAGE_KEY) ?? "[]");
        if (Array.isArray(saved)) setCodes(saved.filter((value): value is string => typeof value === "string").slice(0, 30));
      } catch {
        localStorage.removeItem(`${STORAGE_KEY}:${user.id}`);
      }
    }
    setScheduleHydrated(true);
  }, [user?.id]);

  useEffect(() => {
    if (!user || !scheduleHydrated) return;
    const serialized = JSON.stringify(codes);
    localStorage.setItem(`${STORAGE_KEY}:${user.id}`, serialized);
    const client = getSupabaseBrowserClient();
    void client?.auth.updateUser({ data: { ischedule_course_codes: codes } });
  }, [codes, scheduleHydrated, user?.id]);

  const catalog = useMemo(() => {
    const byCode = new Map<string, Offering>();
    for (const row of rows) {
      if (!byCode.has(row.code)) byCode.set(row.code, row);
    }
    return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
  }, [rows]);
  const availableCodes = useMemo(() => catalog.map((row) => row.code), [catalog]);
  const faculties = useMemo(() => [...new Set(rows.map((row) => row.faculty).filter(Boolean))].sort(), [rows]);
  const years = useMemo(() => [...new Set(rows.map((row) => row.classYear).filter((year) => year > 0))].sort((a, b) => a - b), [rows]);
  const filteredCatalog = useMemo(() => {
    const query = input.trim().toLocaleLowerCase();
    return catalog.filter((row) => {
      const searchable = `${row.code} ${row.name} ${row.nameTh}`.toLocaleLowerCase();
      const matchingRows = rows.filter((candidate) => candidate.code === row.code);
      return (!query || searchable.includes(query)) &&
        (!facultyFilter || matchingRows.some((candidate) => candidate.faculty === facultyFilter)) &&
        (!yearFilter || matchingRows.some((candidate) => String(candidate.classYear) === yearFilter));
    });
  }, [catalog, input, facultyFilter, rows, yearFilter]);
  const hasCourseQuery = Boolean(input.trim() || facultyFilter || yearFilter);
  const selectedRows = useMemo(() => rows.filter((row) => codes.includes(row.code)), [rows, codes]);
  const result = useMemo(() => buildExamGroups(selectedRows, kind), [selectedRows, kind]);
  const byDate = useMemo(() => groupByDate(result.scheduled), [result.scheduled]);
  const selectedNames = useMemo(() => new Map(selectedRows.map((row) => [row.code, row.nameTh || row.name || "ไม่พบชื่อวิชา"])), [selectedRows]);
  const subjectCount = new Set(result.scheduled.map((group) => group.code)).size;

  if (authLoading) return <div className="personal-page-content mx-auto w-full max-w-5xl px-3 py-10 text-center text-sm text-ink-2">{english ? "Checking your KMITL account…" : "กำลังตรวจสอบบัญชี KMITL…"}</div>;
  if (!user) return <div className="personal-page-content mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-3 py-16 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-accent-ink">i</div><h1 className="text-2xl font-bold">{english ? "Sign in to create your personal schedule" : "เข้าสู่ระบบเพื่อสร้างตารางส่วนตัว"}</h1><p className="max-w-md text-sm leading-6 text-ink-2">{english ? <>Use your KMITL Google account ending in <b className="text-ink">@kmitl.ac.th</b> to access your personal schedule.</> : <>ใช้ Google Account ของ KMITL ที่ลงท้ายด้วย <b className="text-ink">@kmitl.ac.th</b> เพื่อเข้าใช้งานตารางส่วนตัว</>}</p><AuthButton />{authError && <p role="alert" className="max-w-md rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn-ink">{authError}</p>}</div>;

  function addCode() {
    const query = input.trim().toLocaleLowerCase();
    const exact = catalog.find((row) => row.code.toLocaleLowerCase() === query);
    const match = exact ?? filteredCatalog[0];
    const code = match?.code ?? input.trim().toUpperCase();
    if (!code) return;
    if (!catalog.some((row) => row.code === code)) {
      setError(`ไม่พบรหัสวิชา ${code} ในข้อมูลตารางสอบชุดนี้`);
      return;
    }
    if (!codes.includes(code)) setCodes((current) => [...current, code]);
    setInput("");
    setError("");
  }

  function addCourse(code: string) {
    if (!codes.includes(code)) setCodes((current) => [...current, code]);
    setInput("");
    setError("");
  }

  return (
    <div className="personal-page-content mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-5 pb-10 sm:gap-5 sm:px-4 sm:py-6 sm:pb-12">
      <header className="text-center sm:py-3">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-xl font-bold text-accent-ink shadow-sm">i</div>
        <p className="text-sm font-medium text-accent">&lt;i&gt;schedule · {english ? "My schedule" : "ตารางของฉัน"}</p>
        <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-4xl">{english ? "My exam schedule" : "ตารางสอบส่วนตัว"}</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-ink-2 sm:text-base">{english ? "Choose your registered courses and view them in the same format as the main schedule." : "เลือกรายวิชาที่ลงทะเบียน แล้วดูตารางสอบในรูปแบบเดียวกับหน้าหลัก"}</p>
      </header>

      <section className="surface-lift overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="border-b border-line bg-accent-soft px-4 py-4 sm:px-5"><h2 className="font-semibold">{english ? "Choose registered courses" : "เลือกวิชาที่ลงทะเบียน"}</h2><p className="mt-1 text-sm text-ink-2">{english ? "Search by course code or name, then add courses to your personal schedule." : "ค้นหาด้วยรหัสหรือชื่อวิชา แล้วกดเพิ่มเพื่อจัดตารางสอบส่วนตัว"}</p></div>
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="course-search">ค้นหารายวิชา</label>
            <input id="course-search" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addCode(); }} list="course-codes" placeholder="ค้นหาด้วยรหัส หรือชื่อวิชา" aria-label="ค้นหาด้วยรหัส หรือชื่อวิชา" className="min-h-12 flex-1 rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink shadow-sm focus-visible:outline-2 focus-visible:outline-accent" />
            <datalist id="course-codes">{availableCodes.map((code) => <option key={code} value={code}>{selectedNames.get(code) ?? ""}</option>)}</datalist>
            <button type="button" onClick={addCode} disabled={loading || filteredCatalog.length === 0} className="min-h-12 rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-accent-ink shadow-sm transition hover:brightness-105 disabled:opacity-60">{english ? "Add course" : "เพิ่มวิชาที่พบ"}</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">
              <span>{english ? "Faculty" : "คณะ"}</span>
              <select value={facultyFilter} onChange={(event) => setFacultyFilter(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-accent">
                <option value="">{english ? "All faculties" : "ทุกคณะ"}</option>
                {faculties.map((faculty) => <option key={faculty} value={faculty}>{faculty}</option>)}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              <span>{english ? "Year" : "ชั้นปี"}</span>
              <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-accent">
                <option value="">{english ? "All years" : "ทุกชั้นปี"}</option>
                {years.map((year) => <option key={year} value={year}>{english ? `Year ${year}` : `ชั้นปีที่ ${year}`}</option>)}
              </select>
            </label>
          </div>
          {hasCourseQuery && <button type="button" onClick={() => { setInput(""); setFacultyFilter(""); setYearFilter(""); }} className="text-left text-xs font-medium text-accent underline-offset-2 hover:underline">ล้างการค้นหาและตัวกรอง</button>}
          <div className="rounded-xl border border-line bg-bg/60 p-3">
            <p className="mb-2 text-xs font-medium text-ink-2">ผลการค้นหา {input || facultyFilter || yearFilter ? `(${filteredCatalog.length})` : ""}</p>
            <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {hasCourseQuery && filteredCatalog.slice(0, 40).map((row) => {
                const selected = codes.includes(row.code);
                return <button key={row.code} type="button" onClick={() => addCourse(row.code)} className={`flex min-h-14 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition ${selected ? "border-accent/40 bg-accent-soft" : "border-line bg-surface hover:border-accent/50 hover:bg-accent-soft"}`}>
                  <span className="min-w-0"><span className="block font-mono text-xs font-semibold text-accent">{row.code}</span><span className="block truncate text-sm text-ink">{row.nameTh || row.name || "ไม่พบชื่อวิชาในข้อมูล"}</span></span>
                  <span className="shrink-0 text-xs font-semibold text-ink-2">{selected ? "เพิ่มแล้ว" : "เพิ่ม"}</span>
                </button>;
              })}
              {!hasCourseQuery && <p className="col-span-full py-5 text-center text-sm text-ink-2">พิมพ์รหัสหรือชื่อวิชา หรือเลือกคณะ/ชั้นปีเพื่อเริ่มค้นหา</p>}
              {hasCourseQuery && !loading && filteredCatalog.length === 0 && <p className="col-span-full py-5 text-center text-sm text-ink-2">ไม่พบวิชาที่ตรงกับการค้นหา</p>}
            </div>
          </div>
          {codes.length ? <div className="flex flex-wrap gap-2" aria-label="วิชาที่เลือก">{codes.map((code) => <span key={code} className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-soft px-3 py-1.5 text-sm"><span className="font-mono font-semibold text-accent">{code}</span><span className="max-w-52 truncate text-ink-2">{selectedNames.get(code) ?? "กำลังโหลด…"}</span><button type="button" onClick={() => setCodes((current) => current.filter((value) => value !== code))} aria-label={`ลบวิชา ${code}`} className="rounded-full px-1 text-ink-2 transition hover:bg-accent hover:text-accent-ink">×</button></span>)}</div> : <p className="rounded-xl border border-dashed border-line bg-bg px-4 py-5 text-center text-sm text-ink-2">ยังไม่ได้เลือกวิชา เริ่มจากค้นหาแล้วกดเพิ่มวิชาด้านบน</p>}
          {loading && <p className="text-sm text-ink-2">กำลังโหลดรหัสวิชา…</p>}
          {error && <p role="alert" className="rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn-ink">{error}</p>}
        </div>
      </section>

      <div className="surface-lift flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
        <span className="font-medium">ตารางสอบ{kind === "midterm" ? "กลางภาค" : "ปลายภาค"}</span><span className="text-ink-2"><b className="tabular-nums text-ink">{subjectCount}</b> วิชา</span><span className="text-ink-2"><b className="tabular-nums text-ink">{result.scheduled.length}</b> รายการสอบ</span>
        <div className="ml-auto grid grid-cols-2 gap-1 rounded-lg bg-bg p-1"><button type="button" onClick={() => setView("grid")} aria-pressed={view === "grid"} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${view === "grid" ? "bg-accent text-accent-ink" : "text-ink-2"}`}>ตารางตามเวลา</button><button type="button" onClick={() => setView("list")} aria-pressed={view === "list"} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${view === "list" ? "bg-accent text-accent-ink" : "text-ink-2"}`}>รายการ</button></div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-bg p-1"><button type="button" onClick={() => setKind("midterm")} aria-pressed={kind === "midterm"} className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold ${kind === "midterm" ? "bg-accent text-accent-ink" : "text-ink-2"}`}>สอบกลางภาค</button><button type="button" onClick={() => setKind("final")} aria-pressed={kind === "final"} className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold ${kind === "final" ? "bg-accent text-accent-ink" : "text-ink-2"}`}>สอบปลายภาค</button></div>
      {codes.length > 0 && <ExamCountdown groups={result.scheduled} spotlight />}
      {result.scheduled.length ? (view === "grid" ? <TimetableGrid groups={result.scheduled} byDate={byDate} banner={["ตารางสอบของฉัน", `${codes.length} วิชา · สอบ${kind === "midterm" ? "กลางภาค" : "ปลายภาค"}`]} /> : <ExamList byDate={byDate} />) : <div className="rounded-xl border border-line bg-surface px-4 py-10 text-center text-ink-2"><p className="font-medium text-ink">{codes.length ? `ยังไม่พบตารางสอบ${kind === "midterm" ? "กลางภาค" : "ปลายภาค"}` : "ตารางของคุณจะแสดงที่นี่"}</p><p className="mt-1 text-sm">{codes.length ? "ตรวจสอบรหัสวิชา หรือเลือกช่วงสอบอื่น" : "เพิ่มรหัสวิชาเพื่อเริ่มจัดตารางส่วนตัว"}</p></div>}
      {result.unscheduled.length > 0 && <details className="rounded-xl border border-line bg-surface px-3.5 py-2.5"><summary className="cursor-pointer font-medium">วิชาที่ยังไม่มีวันสอบ ({result.unscheduled.length})</summary><ul className="mt-2 list-disc pl-5 text-sm text-ink-2">{result.unscheduled.map((item) => <li key={item.code}><span className="font-mono">{item.code}</span> {item.name}</li>)}</ul></details>}
    </div>
  );
}
