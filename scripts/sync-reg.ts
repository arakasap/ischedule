/**
 * ดึงตารางสอนจาก API ของ REG KMITL แล้วเขียน public/data/exams.json
 *
 * ใช้: bun run data:sync
 * ตัวแปรสภาพแวดล้อม (ไม่บังคับ): YEAR=2569 SEM=1 LEVEL=1 DELAY_MS=300 MIN_ROWS=1000 CONTACT=you@kmitl.ac.th
 *
 * หมายเหตุ
 * - ตรรกะพอร์ตมาจาก userscript v0.6/0.7 ซึ่งใช้งานได้จริงในเบราว์เซอร์ของผู้ใช้ แต่เวอร์ชัน Node นี้ยังไม่ได้ทดสอบกับ API จริง
 *   ถ้าเซิร์ฟเวอร์ REG ปฏิเสธคำขอนอกเบราว์เซอร์ ให้ใช้ userscript ส่งออก CSV แล้วรัน bun run data:csv แทน
 * - API นี้เป็น API ภายในของ REG ควรขออนุญาตสำนักทะเบียนหรือศูนย์คอมพิวเตอร์ก่อนรันเป็นงานตั้งเวลาให้คนทั้งมหาลัยใช้
 * - ไม่ยิงถี่เกินไป (หน่วง DELAY_MS ต่อคำขอ) และถ้าได้แถวน้อยผิดปกติ (< MIN_ROWS) จะไม่เขียนทับไฟล์เดิม
 */
import type { Offering } from "../lib/types";
import { regSlot, writeDataset } from "./shared";

const API = "https://regis.reg.kmitl.ac.th/api/";
const YEAR = process.env.YEAR ?? "2569";
const SEM = process.env.SEM ?? "1";
const LEVEL = process.env.LEVEL ?? "1";
const DELAY_MS = Number(process.env.DELAY_MS ?? 300);
const MIN_ROWS = Number(process.env.MIN_ROWS ?? 1000);
const CONTACT = process.env.CONTACT ?? "";
const TIMEOUT_MS = 40_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());

function stripHtml(v: unknown): string {
  return str(v)
    .replace(/<\/(div|p)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .join(", ");
}

const DAYS = ["", "อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const hm = (t: unknown) => str(t).slice(0, 5);

interface Sel {
  faculty: string;
  classYear?: string;
}

function buildUrl(sel: Sel): string {
  const p = new URLSearchParams({
    function: "get-teach-table-show",
    level_id: LEVEL,
    mode: "by_class",
    selected_year: YEAR,
    selected_semester: SEM,
    selected_faculty: sel.faculty,
    search_all_faculty: "false",
    search_all_department: "true",
    search_all_curriculum: "true",
    search_all_branch: "true",
    search_all_class_year: sel.classYear === undefined ? "true" : "false",
  });
  if (sel.classYear !== undefined) p.set("selected_class_year", sel.classYear);
  return `${API}?${p.toString()}`;
}

async function getJson(url: string): Promise<unknown> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      headers: {
        Accept: "application/json",
        Referer: "https://regis.reg.kmitl.ac.th/",
        "User-Agent": `kmitl-exam-table-sync${CONTACT ? ` (${CONTACT})` : ""}`,
      },
    });
    const body = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status} ${body.slice(0, 120)}`);
    return JSON.parse(body);
  } finally {
    clearTimeout(timer);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rec = Record<string, any>;

function flatten(json: unknown): Offering[] {
  const out: Offering[] = [];
  for (const f of (Array.isArray(json) ? json : []) as Rec[]) {
    for (const g of (f.teachtable ?? []) as Rec[]) {
      for (const rec of (g.data ?? []) as Rec[]) {
        const typeCode = str(rec.lect_or_prac);
        const day = DAYS[Number(rec.teach_day)] ?? "";
        const tt = rec.teach_time ? hm(rec.teach_time) + (rec.teach_time2 ? `-${hm(rec.teach_time2)}` : "") : "";
        out.push({
          id: str(rec.teach_table_id),
          facultyId: str(f.faculty_id),
          faculty: str(f.faculty_name_th) || str(f.faculty_name_en),
          deptId: str(f.department_id),
          dept: str(f.department_name_th) || str(f.department_name_en),
          curriculumId: str(f.curriculum2_id),
          curriculum: str(f.curriculum_name_th),
          classYear: Number(f.class) || 0,
          code: str(rec.subject_id),
          name: str(rec.subject_name_en) || str(rec.subject_name_th),
          nameTh: str(rec.subject_name_th),
          credit: str(rec.credit_str) || str(rec.credit),
          section: str(rec.section),
          type: typeCode === "ท" ? "ทฤษฎี" : typeCode === "ป" ? "ปฏิบัติ" : typeCode,
          time: [day, tt].filter(Boolean).join(" "),
          room: [str(rec.room_name), str(rec.building_name)].filter(Boolean).join(" / "),
          teacher: stripHtml(rec.teacher_list_th) || stripHtml(rec.teacher_list_en),
          midterm: regSlot(rec.midterm_start_date_time, rec.midterm_end_date_time),
          final: regSlot(rec.final_start_date_time, rec.final_end_date_time),
          cond: stripHtml(rec.rules_th) || stripHtml(rec.rules_en),
          seats: str(rec.limit),
          enrolled: str(rec.count),
        });
      }
    }
  }
  return out;
}

async function main() {
  const acc: Offering[] = [];
  const failed: string[] = [];

  // รหัสคณะที่ยืนยันแล้วมีเฉพาะ 07 จึงวน 01-40 แล้วข้ามตัวที่ไม่มีข้อมูล
  // คณะใหญ่อาจล้ม/ค้างถ้าขอทั้งคณะ จึงถอยไปขอทีละชั้นปี 0-7
  for (let i = 1; i <= 40; i++) {
    const fid = String(i).padStart(2, "0");
    try {
      acc.push(...flatten(await getJson(buildUrl({ faculty: fid }))));
    } catch (e) {
      console.warn(`คณะ ${fid} (ทั้งคณะ): ${(e as Error).message} -> ลองแยกทีละชั้นปี`);
      let got = 0;
      let bad = 0;
      for (let y = 0; y <= 7; y++) {
        try {
          const list = flatten(await getJson(buildUrl({ faculty: fid, classYear: String(y) })));
          acc.push(...list);
          got += list.length;
        } catch (e2) {
          bad++;
          console.warn(`  คณะ ${fid} ชั้นปี ${y}: ${(e2 as Error).message}`);
        }
        await sleep(DELAY_MS);
      }
      if (!got && bad) failed.push(fid);
    }
    await sleep(DELAY_MS);
    process.stdout.write(`\rคณะ ${fid}/40 สะสม ${acc.length} แถว   `);
  }
  console.log("");

  const seen = new Set<string>();
  const rows = acc.filter((r) => {
    const k = r.id || `${r.code}|${r.section}|${r.type}|${r.curriculum}|${r.classYear}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  if (rows.length < MIN_ROWS) {
    throw new Error(`ได้แค่ ${rows.length} แถว (ต่ำกว่า MIN_ROWS=${MIN_ROWS}) จึงไม่เขียนทับไฟล์เดิม ตรวจว่า API เปลี่ยนโครงสร้างหรือไม่`);
  }
  if (failed.length) console.warn("คณะที่ดึงไม่สำเร็จ:", failed.join(", "));
  writeDataset(rows, `${SEM}/${YEAR}`, LEVEL === "1" ? "ปริญญาตรี" : `ระดับ ${LEVEL}`, "REG KMITL");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
