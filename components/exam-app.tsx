"use client";

import { useEffect, useMemo, useState } from "react";
import { ExamList } from "@/components/exam-list";
import { useLanguage } from "@/components/language-provider";
import { ExamCountdown } from "@/components/exam-countdown";
import { Segmented } from "@/components/segmented";
import { TimetableGrid } from "@/components/timetable-grid";
import {
  ALL,
  DOW,
  EXAM_KIND_LABEL,
  NO_CURRICULUM_LABEL,
  type ExamGroup,
  biggestCurriculum,
  buildExamGroups,
  curriculumList,
  facultyList,
  filterRows,
  groupByDate,
  dateParts,
  sectionsOf,
  thaiDate,
  yearList,
} from "@/lib/exam-utils";
import type { Dataset, ExamKind, ViewMode } from "@/lib/types";

const selectClass =
  "filter-select w-full min-w-0 rounded-xl border border-line bg-bg px-3 py-2.5 text-ink shadow-sm focus-visible:outline-2 focus-visible:outline-accent";

function yearLabel(y: number) {
  return y === 0 ? "ไม่ระบุชั้นปี (0)" : `ชั้นปี ${y}`;
}

export function ExamApp() {
  const { language } = useLanguage();
  const english = language === "en";
  const [data, setData] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [faculty, setFaculty] = useState("");
  const [curriculum, setCurriculum] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [kind, setKind] = useState<ExamKind>("final");
  const [view, setView] = useState<ViewMode>("grid");
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");

  // โหลดข้อมูลครั้งเดียว แล้วตั้งค่าเริ่มต้นจาก URL (ถ้ามี) หรือค่าตัวอย่าง
  useEffect(() => {
    let cancelled = false;
    fetch("/data/exams.json")
      .then((res) => {
        if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
        return res.json() as Promise<Dataset>;
      })
      .then((ds) => {
        if (cancelled) return;
        const faculties = facultyList(ds.rows);
        const q = new URLSearchParams(window.location.search);
        const qf = q.get("f");
        const f = qf && faculties.includes(qf) ? qf : (faculties.find((x) => x === "เทคโนโลยีสารสนเทศ") ?? faculties[0] ?? "");
        const curs = curriculumList(ds.rows, f).map((c) => c.name);
        const qc = q.get("c");
        const c = qc === ALL || (qc !== null && curs.includes(qc)) ? qc : biggestCurriculum(ds.rows, f);
        const years = yearList(ds.rows, f, c).map(String);
        const qy = q.get("y");
        const y = qy === ALL || (qy !== null && years.includes(qy)) ? qy : years.includes("1") ? "1" : ALL;
        setData(ds);
        setFaculty(f);
        setCurriculum(c);
        setYear(y);
        if (q.get("k") === "midterm") setKind("midterm");
        if (q.get("v") === "list") setView("list");
        setReady(true);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // เก็บตัวเลือกไว้ใน URL เพื่อส่งลิงก์ต่อได้
  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams({ f: faculty, c: curriculum, y: year, k: kind, v: view });
    window.history.replaceState(null, "", `?${q.toString()}`);
  }, [ready, faculty, curriculum, year, kind, view]);

  const faculties = useMemo(() => (data ? facultyList(data.rows) : []), [data]);
  const curriculums = useMemo(() => (data ? curriculumList(data.rows, faculty) : []), [data, faculty]);
  const years = useMemo(() => (data ? yearList(data.rows, faculty, curriculum) : []), [data, faculty, curriculum]);

  const result = useMemo(() => {
    if (!data) return null;
    return buildExamGroups(filterRows(data.rows, faculty, curriculum, year), kind);
  }, [data, faculty, curriculum, year, kind]);

  const byDate = useMemo(() => (result ? groupByDate(result.scheduled) : new Map<string, ExamGroup[]>()), [result]);

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-line bg-surface p-4 text-sm">
        {error} ตรวจว่ามีไฟล์ public/data/exams.json (สร้างด้วย <code className="font-mono">bun run data:csv</code>)
      </div>
    );
  }
  if (!data || !result) {
    return (
      <section aria-busy="true" aria-label="กำลังโหลดข้อมูลตารางสอบ" className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="skeleton h-20 rounded-none" />
          <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
            {[1, 2, 3, 4, 5].map((item) => <div key={item} className="skeleton h-11 rounded-lg" />)}
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="skeleton h-14 rounded-none" />
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((item) => <div key={item} className="skeleton h-16 rounded-lg" />)}
          </div>
        </div>
        <p className="text-center text-sm text-ink-2">กำลังเตรียมตารางสอบให้คุณ...</p>
      </section>
    );
  }

  const kindLabel = EXAM_KIND_LABEL[kind];
  const [termNo, termYear] = data.meta.term.split("/");
  const termLabel = `ภาคเรียนที่ ${termNo} ปีการศึกษา ${termYear}`;
  const curLabel = curriculum === ALL ? "ทุกหลักสูตร" : curriculum || NO_CURRICULUM_LABEL;
  const yrLabel = year === ALL ? "ทุกชั้นปี" : yearLabel(Number(year));
  const dates = [...byDate.keys()];
  const subjectCount = new Set(result.scheduled.map((g) => g.code)).size;

  function onFaculty(f: string) {
    if (!data) return;
    const c = biggestCurriculum(data.rows, f);
    const ys = yearList(data.rows, f, c).map(String);
    setFaculty(f);
    setCurriculum(c);
    setYear(ys.includes("1") ? "1" : ALL);
  }

  function onCurriculum(c: string) {
    if (!data) return;
    const ys = yearList(data.rows, faculty, c).map(String);
    setCurriculum(c);
    if (year !== ALL && !ys.includes(year)) setYear(ALL);
  }

  async function copyText() {
    const lines = [`ตารางสอบ${kindLabel} ${termLabel}`, [faculty, curLabel, yrLabel].join(" | "), ""];
    byDate.forEach((list, date) => {
      lines.push(`${DOW[dateParts(date).dow]} ${thaiDate(date)}`);
      for (const g of list) lines.push(`  ${g.info.label}  ${g.code}  ${g.name} (กลุ่ม ${sectionsOf(g)})`);
    });
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    setTimeout(() => setCopied("idle"), 1800);
  }

  return (
    <>
      <section aria-labelledby="filter-title" className="surface-lift overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="border-b border-line bg-accent-soft px-4 py-4 sm:px-5">
          <h2 id="filter-title" className="font-semibold">{english ? "Find an exam schedule" : "ค้นหาตารางสอบ"}</h2>
          <p className="mt-1 text-sm text-ink-2">{english ? "Choose your details to show relevant subjects" : "เลือกข้อมูลของคุณเพื่อแสดงวิชาที่เกี่ยวข้อง"}</p>
        </div>
        <div className="filter-fields grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
        <div className="filter-field flex min-w-0 flex-col gap-1.5">
          <label htmlFor="fac" className="text-xs font-medium tracking-wide text-ink-2">
            {english ? "Faculty / unit" : "คณะ / หน่วยงาน"}
          </label>
          <select id="fac" className={selectClass} value={faculty} onChange={(e) => onFaculty(e.target.value)}>
            {faculties.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field flex min-w-0 flex-col gap-1.5">
          <label htmlFor="cur" className="text-xs font-medium tracking-wide text-ink-2">
            {english ? "Curriculum" : "หลักสูตรหรือสาขา"}
          </label>
          <select id="cur" className={selectClass} value={curriculum} onChange={(e) => onCurriculum(e.target.value)}>
            <option value={ALL}>{english ? "All curricula in this faculty" : "ทุกหลักสูตรในคณะนี้"} ({curriculums.length})</option>
            {curriculums.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name || NO_CURRICULUM_LABEL}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field flex min-w-0 flex-col gap-1.5">
          <label htmlFor="yr" className="text-xs font-medium tracking-wide text-ink-2">
            {english ? "Year" : "ชั้นปี"}
          </label>
          <select id="yr" className={selectClass} value={year} onChange={(e) => setYear(e.target.value)}>
            <option value={ALL}>{english ? "All years" : "ทุกชั้นปี"}</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {yearLabel(y)}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-segment sm:col-span-3">
          <Segmented<ExamKind>
            label={english ? "Exam type" : "การสอบ"}
            value={kind}
            onChange={setKind}
            options={[
              { value: "midterm", label: english ? "Midterm" : "สอบกลางภาค" },
              { value: "final", label: english ? "Final" : "สอบปลายภาค" },
            ]}
          />
        </div>
        <div className="filter-segment sm:col-span-3">
          <Segmented<ViewMode>
            label={english ? "View" : "มุมมอง"}
            value={view}
            onChange={setView}
            options={[
              { value: "grid", label: english ? "Timeline" : "ตารางตามเวลา" },
              { value: "list", label: english ? "List" : "รายการ" },
            ]}
          />
        </div>
        </div>
      </section>

      <div className="surface-lift flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
        <span className="font-medium">ตารางสอบ{kindLabel}</span>
        <span className="text-ink-2"><b className="tabular-nums text-ink">{subjectCount}</b> วิชา</span>
        {dates.length > 0 && (
          <span>
            ช่วง <b>{thaiDate(dates[0])}</b> ถึง <b>{thaiDate(dates[dates.length - 1])}</b> ({dates.length} วัน)
          </span>
        )}
        {result.unscheduled.length > 0 && <span>ยังไม่มีวันสอบ {result.unscheduled.length} วิชา</span>}
        <button
          type="button"
          onClick={copyText}
          className="ml-auto cursor-pointer rounded-md border border-line bg-surface px-3 py-1.5 text-[0.85rem] hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {copied === "ok" ? "คัดลอกแล้ว" : copied === "fail" ? "คัดลอกไม่ได้" : "คัดลอกตาราง"}
        </button>
      </div>

      <ExamCountdown groups={result.scheduled} spotlight={false} />

      {result.scheduled.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface px-4 py-10 text-center text-ink-2">
          <p className="font-medium text-ink">ยังไม่พบตารางสอบ</p>
          <p className="mt-1 text-sm">ลองเปลี่ยนคณะ หลักสูตร หรือชั้นปีที่เลือก</p>
        </div>
      ) : view === "grid" ? (
        <TimetableGrid
          groups={result.scheduled}
          byDate={byDate}
          banner={[`คณะ${faculty.replace(/^คณะ/, "")}`, curLabel, `${yrLabel} · ${termLabel} · สอบ${kindLabel}`]}
        />
      ) : (
        <ExamList byDate={byDate} />
      )}

      {result.unscheduled.length > 0 && (
        <details className="rounded-xl border border-line bg-surface px-3.5 py-2.5">
          <summary className="cursor-pointer font-medium">
            วิชาที่สอบนอกตาราง ({result.unscheduled.length})
          </summary>
          <ul className="mt-2 list-disc pl-5 text-[0.88rem] text-ink-2">
            {result.unscheduled.map((s) => (
              <li key={s.code}>
                <span className="font-mono">{s.code}</span> {s.name}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="rounded-lg bg-warn-soft px-3.5 py-2.5 text-[0.85rem] text-warn-ink">
        <b className="font-semibold">หมายเหตุ:</b> ตารางนี้แสดงวิชาที่เปิดสอนตามตัวเลือก ไม่ใช่รายวิชาที่คุณลงทะเบียนจริง
        กรุณาตรวจห้องสอบ กลุ่มเรียน และเงื่อนไขการสอบกับระบบ REG หรือประกาศของคณะก่อนเข้าสอบ
      </div>
      <footer className="text-[0.8rem] text-ink-2">
        ข้อมูลจากระบบ REG KMITL ภาค {data.meta.term} ระดับ{data.meta.level} ดึงเมื่อ {data.meta.fetchedAt} (ภาพนิ่ง อัปเดตด้วยสคริปต์ data:sync)
      </footer>
    </>
  );
}
