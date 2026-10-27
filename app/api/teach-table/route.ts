import { NextRequest, NextResponse } from "next/server";
import snapshot from "../../../public/data/exams.json";
import type { Offering } from "@/lib/types";
import { regSlot } from "@/scripts/shared";

export const runtime = "nodejs";

const REG_API = "https://regis.reg.kmitl.ac.th/api/";
const cache = new Map<string, { expires: number; value: ApiPayload }>();
const requests = new Map<string, { count: number; reset: number }>();

interface ApiPayload {
  live: boolean;
  fetchedAt: string;
  source: string;
  rows: Offering[];
  warning?: string;
}

type RecordValue = Record<string, any>;
const str = (value: unknown, max = 500) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

function stripHtml(value: unknown): string {
  return str(value)
    .replace(/<\/(div|p|li)>|<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .split("\n").map((line) => line.trim()).filter(Boolean).join(", ");
}

function extractTrack(remark: string, rules: string): string | null {
  const text = stripHtml(`${remark} ${rules}`);
  const match = text.match(/(?:แขนงวิชา|กลุ่มวิชาด้าน|วิชาเอก|เฉพาะนักศึกษา)\s*([^,;|]+)/);
  return match?.[1]?.trim().slice(0, 180) || null;
}

function validParam(value: string | null, max = 20) {
  return Boolean(value && /^\d+$/.test(value) && value.length <= max);
}

function paramsFrom(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const result = {
    faculty: search.get("faculty"),
    department: search.get("department"),
    curriculum: search.get("curriculum"),
    classYear: search.get("classYear"),
    year: search.get("year") || "2569",
    semester: search.get("semester") || "1",
    level: search.get("level") || "1",
  };
  if (!validParam(result.faculty) || !validParam(result.classYear) || !validParam(result.year, 4) || !validParam(result.semester, 2) || !validParam(result.level, 2)) return null;
  if (result.department && !validParam(result.department)) return null;
  if (result.curriculum && !validParam(result.curriculum)) return null;
  return result;
}

function buildRegUrl(params: NonNullable<ReturnType<typeof paramsFrom>>) {
  const search = new URLSearchParams({
    function: "get-teach-table-show",
    level_id: params.level,
    mode: "by_class",
    selected_year: params.year,
    selected_semester: params.semester,
    selected_faculty: params.faculty!,
    selected_department: params.department || "",
    selected_curriculum: params.curriculum || "",
    selected_class_year: params.classYear!,
    search_all_faculty: "false",
    search_all_department: params.department ? "false" : "true",
    search_all_curriculum: params.curriculum ? "false" : "true",
    search_all_branch: "true",
    search_all_class_year: "false",
  });
  return `${REG_API}?${search.toString()}`;
}

function normalize(json: unknown): Offering[] {
  const rows: Offering[] = [];
  for (const faculty of (Array.isArray(json) ? json : []) as RecordValue[]) {
    for (const group of (faculty.teachtable ?? []) as RecordValue[]) {
      for (const item of (group.data ?? []) as RecordValue[]) {
        const code = str(item.subject_id, 30);
        if (!code) continue;
        const type = str(item.lect_or_prac, 10);
        const start = str(item.teach_time, 20).slice(0, 5);
        const end = str(item.teach_time2, 20).slice(0, 5);
        const remark = stripHtml(item.remark);
        const rules = stripHtml(item.rules_th || item.rules_en);
        rows.push({
          id: str(item.teach_table_id, 80),
          facultyId: str(faculty.faculty_id, 20),
          faculty: str(faculty.faculty_name_th || faculty.faculty_name_en, 180),
          deptId: str(faculty.department_id, 20),
          dept: str(faculty.department_name_th || faculty.department_name_en, 180),
          curriculumId: str(faculty.curriculum2_id, 20),
          curriculum: str(faculty.curriculum_name_th, 180),
          classYear: Number(faculty.class) || 0,
          code,
          name: str(item.subject_name_en || item.subject_name_th, 240),
          nameTh: str(item.subject_name_th, 240),
          credit: str(item.credit_str || item.credit, 40),
          section: str(item.section, 40),
          type: type === "ท" ? "ทฤษฎี" : type === "ป" ? "ปฏิบัติ" : type,
          time: [str(item.teach_day, 10), [start, end].filter(Boolean).join("-")].filter(Boolean).join(" "),
          room: [str(item.room_name), str(item.building_name)].filter(Boolean).join(" / "),
          teacher: stripHtml(item.teacher_list_th || item.teacher_list_en),
          midterm: regSlot(item.midterm_start_date_time, item.midterm_end_date_time),
          final: regSlot(item.final_start_date_time, item.final_end_date_time),
          cond: rules,
          seats: str(item.limit),
          enrolled: str(item.count),
          track: extractTrack(remark, rules),
          remark,
        });
      }
    }
  }
  return rows;
}

function fallback(params: NonNullable<ReturnType<typeof paramsFrom>>): Offering[] {
  const rows = (snapshot as { rows: Offering[] }).rows;
  return rows.filter((row) => row.classYear === Number(params.classYear));
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json", Referer: "https://regis.reg.kmitl.ac.th/" }, next: { revalidate: 600 } });
    if (!response.ok) throw new Error(`REG ตอบกลับ HTTP ${response.status}`);
    return await response.json() as unknown;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: NextRequest) {
  const params = paramsFrom(request);
  if (!params) return NextResponse.json({ error: "พารามิเตอร์ไม่ถูกต้อง" }, { status: 400 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const current = requests.get(ip);
  if (current && current.reset > now && current.count >= 12) return NextResponse.json({ error: "เรียกข้อมูลถี่เกินไป กรุณารอสักครู่" }, { status: 429 });
  requests.set(ip, current && current.reset > now ? { count: current.count + 1, reset: current.reset } : { count: 1, reset: now + 60_000 });

  const key = JSON.stringify(params);
  const cached = cache.get(key);
  if (cached && cached.expires > now) return NextResponse.json(cached.value, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=600" } });

  try {
    const rows = normalize(await fetchWithTimeout(buildRegUrl(params)));
    const payload: ApiPayload = { live: true, fetchedAt: new Date().toISOString(), source: "REG KMITL (เรียลไทม์)", rows };
    cache.set(key, { expires: now + 600_000, value: payload });
    return NextResponse.json(payload, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=600" } });
  } catch (error) {
    const payload: ApiPayload = { live: false, fetchedAt: new Date().toISOString(), source: "snapshot สำรอง", rows: fallback(params), warning: error instanceof Error ? error.message : "ดึงข้อมูล REG ไม่สำเร็จ" };
    return NextResponse.json(payload, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=600" } });
  }
}
