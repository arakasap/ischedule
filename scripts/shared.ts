import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Dataset, Offering, Slot } from "../lib/types";

export const OUTPUT = "public/data/exams.json";

/** รูปแบบที่ API ของ REG ส่งมา: "2026-08-18 09:30:00" -> "2026-08-18T09:30" */
export function regDateTime(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/.exec(String(v).trim());
  return m ? `${m[1]}T${m[2]}` : null;
}

export function regSlot(start: unknown, end: unknown): Slot | null {
  const s = regDateTime(start);
  return s ? { start: s, end: regDateTime(end) } : null;
}

/** รูปแบบใน CSV ที่เคยส่งออกไว้: "18/08/2569 09:30-12:30" (พ.ศ.) -> ISO (ค.ศ.) */
export function thaiTextSlot(text: string): Slot | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2})(?:-(\d{2}:\d{2}))?$/.exec(text.trim());
  if (!m) return null;
  const date = `${Number(m[3]) - 543}-${m[2]}-${m[1]}`;
  return { start: `${date}T${m[4]}`, end: m[5] ? `${date}T${m[5]}` : null };
}

export function writeDataset(rows: Offering[], term: string, level: string, source: string, output = OUTPUT): void {
  const dataset: Dataset = {
    meta: { term, level, source, fetchedAt: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" }), rowCount: rows.length },
    rows,
  };
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(dataset));
  console.log(`เขียน ${rows.length} แถว -> ${output}`);
}
