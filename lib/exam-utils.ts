import type { ExamKind, Offering, Slot } from "./types";

export const DOW = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"] as const;
export const MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."] as const;

export const ALL = "__all__";
export const NO_CURRICULUM_LABEL = "(วิชากลาง ไม่ผูกหลักสูตร)";

/** ป้ายข้อความกลางของหน้าตารางสอบ เพื่อให้ UI ใช้คำเรียกเดียวกันทุกมุมมอง */
export const EXAM_KIND_LABEL: Record<ExamKind, string> = {
  midterm: "กลางภาค",
  final: "ปลายภาค",
};

const pad2 = (n: number) => String(n).padStart(2, "0");

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
}

export interface SlotInfo {
  /** YYYY-MM-DD (ค.ศ.) */
  date: string;
  startMin: number;
  endMin: number;
  /** เช่น "09:30–12:30" */
  label: string;
  sortKey: string;
}

export function parseSlot(slot: Slot | null): SlotInfo | null {
  if (!slot) return null;
  const [date, start] = slot.start.split("T");
  if (!date || !start) return null;
  const end = slot.end ? slot.end.split("T")[1] : undefined;
  const startMin = toMinutes(start);
  const endMin = end ? toMinutes(end) : startMin + 60;
  return {
    date,
    startMin,
    endMin,
    label: end ? `${start}–${end}` : start,
    sortKey: `${date} ${start}`,
  };
}

export interface DateParts {
  y: number;
  m: number;
  d: number;
  dow: number;
}

export function dateParts(date: string): DateParts {
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, dow };
}

/** "2 พ.ย. 2569" */
export function thaiDate(date: string): string {
  const p = dateParts(date);
  return `${p.d} ${MON[p.m - 1]} ${p.y + 543}`;
}

export interface ExamGroup {
  key: string;
  code: string;
  name: string;
  credit: string;
  info: SlotInfo;
  rows: Offering[];
}

export interface UnscheduledSubject {
  code: string;
  name: string;
}

export interface ExamResult {
  scheduled: ExamGroup[];
  unscheduled: UnscheduledSubject[];
}

/** รวมกลุ่มเรียนที่สอบวัน-เวลาเดียวกันของวิชาเดียวกันให้เป็นแถวเดียว */
export function buildExamGroups(rows: Offering[], kind: ExamKind): ExamResult {
  const scheduledMap = new Map<string, ExamGroup>();
  const pending = new Map<string, UnscheduledSubject>();

  for (const r of rows) {
    const slot = kind === "midterm" ? r.midterm : r.final;
    const info = parseSlot(slot);
    if (!info) {
      if (!pending.has(r.code)) pending.set(r.code, { code: r.code, name: r.name });
      continue;
    }
    const key = `${r.code}|${info.sortKey}|${info.endMin}`;
    const found = scheduledMap.get(key);
    if (found) found.rows.push(r);
    else scheduledMap.set(key, { key, code: r.code, name: r.name, credit: r.credit, info, rows: [r] });
  }

  const scheduled = [...scheduledMap.values()].sort(
    (a, b) => a.info.sortKey.localeCompare(b.info.sortKey) || a.code.localeCompare(b.code),
  );
  const have = new Set(scheduled.map((g) => g.code));
  const unscheduled = [...pending.values()]
    .filter((s) => !have.has(s.code))
    .sort((a, b) => a.code.localeCompare(b.code));
  return { scheduled, unscheduled };
}

export function groupByDate(groups: ExamGroup[]): Map<string, ExamGroup[]> {
  const map = new Map<string, ExamGroup[]>();
  for (const g of groups) {
    const list = map.get(g.info.date);
    if (list) list.push(g);
    else map.set(g.info.date, [g]);
  }
  return map;
}

export function sectionsOf(g: ExamGroup): string {
  return [...new Set(g.rows.map((r) => r.section))].sort((a, b) => Number(a) - Number(b)).join(", ");
}

export function typesOf(g: ExamGroup): string {
  return [...new Set(g.rows.map((r) => (r.type === "ทฤษฎี" ? "ท" : r.type === "ปฏิบัติ" ? "ป" : r.type)))].join("/");
}

/** วันที่ที่ต้องแสดงในตาราง: ทุกวันจันทร์-ศุกร์ระหว่างวันแรกถึงวันสุดท้าย + เสาร์-อาทิตย์ที่มีสอบ */
export function visibleDates(byDate: Map<string, ExamGroup[]>): string[] {
  const keys = [...byDate.keys()].sort();
  if (!keys.length) return [];
  const toUtc = (k: string) => {
    const p = dateParts(k);
    return Date.UTC(p.y, p.m - 1, p.d);
  };
  const out: string[] = [];
  for (let t = toUtc(keys[0]); t <= toUtc(keys[keys.length - 1]); t += 86_400_000) {
    const dt = new Date(t);
    const key = `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
    const wd = dt.getUTCDay();
    if (byDate.has(key) || (wd !== 0 && wd !== 6)) out.push(key);
  }
  return out;
}

/** ช่วงชั่วโมงของแกนเวลา: อย่างน้อย 08:00-18:00 และขยายตามวิชาที่สอบนอกช่วง */
export function hourRange(groups: ExamGroup[]): { t0: number; t1: number } {
  if (!groups.length) return { t0: 8, t1: 18 };
  const minStart = Math.min(...groups.map((g) => g.info.startMin));
  const maxEnd = Math.max(...groups.map((g) => g.info.endMin));
  return { t0: Math.min(8, Math.floor(minStart / 60)), t1: Math.max(18, Math.ceil(maxEnd / 60)) };
}

/** จัดวิชาที่เวลาทับกันในวันเดียวกันเป็นหลายบรรทัด (lane) */
export function layoutLanes(list: ExamGroup[]): { items: { group: ExamGroup; lane: number }[]; laneCount: number } {
  const sorted = [...list].sort((a, b) => a.info.startMin - b.info.startMin || a.code.localeCompare(b.code));
  const laneEnds: number[] = [];
  const items = sorted.map((group) => {
    let lane = laneEnds.findIndex((end) => end <= group.info.startMin);
    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = group.info.endMin;
    return { group, lane };
  });
  return { items, laneCount: Math.max(1, laneEnds.length) };
}

// ใช้เฉดส้ม/amber ให้สอดคล้องกับ brand และเข้มพอสำหรับตัวอักษรสีขาวบนตาราง
const PALETTE = ["#c2410c", "#b45309", "#9a3412", "#ea580c", "#a16207", "#9f1239", "#7c2d12", "#d97706", "#92400e", "#c2410c"];

/** สีประจำวิชา (ขาวบนสีเหล่านี้อ่านได้ทั้งโหมดสว่างและมืด) */
export function colorFor(code: string): string {
  let sum = 0;
  for (const ch of code) sum += ch.charCodeAt(0);
  return PALETTE[sum % PALETTE.length];
}

/* ---------- ตัวเลือกตัวกรอง ---------- */

export function facultyList(rows: Offering[]): string[] {
  return [...new Set(rows.map((r) => r.faculty))].sort((a, b) => a.localeCompare(b, "th"));
}

export interface CurriculumOption {
  name: string;
  count: number;
}

export function curriculumList(rows: Offering[], faculty: string): CurriculumOption[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (r.faculty === faculty) counts.set(r.curriculum, (counts.get(r.curriculum) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, "th"));
}

export function yearList(rows: Offering[], faculty: string, curriculum: string): number[] {
  const years = new Set<number>();
  for (const r of rows) {
    if (r.faculty === faculty && (curriculum === ALL || r.curriculum === curriculum)) years.add(r.classYear);
  }
  return [...years].sort((a, b) => a - b);
}

export function filterRows(rows: Offering[], faculty: string, curriculum: string, year: string): Offering[] {
  return rows.filter(
    (r) =>
      r.faculty === faculty &&
      (curriculum === ALL || r.curriculum === curriculum) &&
      (year === ALL || r.classYear === Number(year)),
  );
}

/** หลักสูตรที่มีแถวมากที่สุดในคณะ ใช้เป็นค่าเริ่มต้น */
export function biggestCurriculum(rows: Offering[], faculty: string): string {
  const list = curriculumList(rows, faculty);
  if (!list.length) return ALL;
  return list.reduce((a, b) => (b.count > a.count ? b : a)).name;
}
