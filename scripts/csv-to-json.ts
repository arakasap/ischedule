/**
 * แปลง CSV ที่ได้จาก userscript (kmitl-exam-api.user.js) เป็น public/data/exams.json
 *
 * ใช้: bun run data:csv [พาธไฟล์ csv] [ภาคเรียน เช่น 1/2569]
 * ค่าเริ่มต้น: data/source/kmitl-teach-table.csv และ 1/2569
 *
 * CSV รุ่นเก่ายังไม่มีรหัสคณะ/แผนก/หลักสูตร จึงเว้นช่องรหัสเป็นค่าว่าง
 * (CSV จาก userscript v0.7 ขึ้นไปมีคอลัมน์รหัสให้ และสคริปต์นี้จะอ่านให้อัตโนมัติ)
 */
import { readFileSync } from "node:fs";
import type { Offering } from "../lib/types";
import { thaiTextSlot, writeDataset } from "./shared";

/** parser CSV แบบ RFC 4180 (รองรับเครื่องหมายคำพูดและขึ้นบรรทัดใหม่ในช่อง) */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const input = process.argv[2] ?? "data/source/kmitl-teach-table.csv";
const term = process.argv[3] ?? "1/2569";

const raw = readFileSync(input, "utf-8").replace(/^﻿/, "");
const [header, ...body] = parseCsv(raw);
const col = (name: string) => header.indexOf(name);
const get = (r: string[], name: string) => (col(name) >= 0 ? (r[col(name)] ?? "").trim() : "");

const rows: Offering[] = body.map((r, i) => ({
  id: `csv-${i}`,
  facultyId: get(r, "รหัสคณะ"),
  faculty: get(r, "คณะ"),
  deptId: get(r, "รหัสแผนก"),
  dept: get(r, "แผนก"),
  curriculumId: get(r, "รหัสหลักสูตร"),
  curriculum: get(r, "หลักสูตร"),
  classYear: Number(get(r, "ชั้นปี")) || 0,
  code: get(r, "รหัสวิชา"),
  name: get(r, "ชื่อวิชา"),
  nameTh: "",
  credit: get(r, "หน่วยกิต"),
  section: get(r, "กลุ่ม"),
  type: get(r, "ประเภท"),
  time: get(r, "วัน-เวลาเรียน"),
  room: get(r, "ห้อง"),
  teacher: get(r, "อาจารย์"),
  midterm: thaiTextSlot(get(r, "สอบกลางภาค")),
  final: thaiTextSlot(get(r, "สอบปลายภาค")),
  cond: get(r, "เงื่อนไข"),
  seats: get(r, "รับ"),
  enrolled: get(r, "ลงแล้ว"),
}));

writeDataset(rows, term, "ปริญญาตรี", "REG KMITL (นำเข้าจาก CSV)");
