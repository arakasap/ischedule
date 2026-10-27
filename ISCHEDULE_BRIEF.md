# iSchedule — Brief สำหรับ CLI (v2)

Repo: https://github.com/arakasap/ischedule (Next.js 16 App Router · React 19 · TypeScript 5 · Tailwind 4 · Bun/Node)
เว็บที่ deploy: https://ischedule-ten.vercel.app
ผู้ใช้: เจ้าของโปรเจกต์จบ (นักศึกษา KMITL) ใช้ภาษาไทย ตอบและเขียน UI เป็นภาษาไทย

> ไฟล์นี้**แทนที่**ทิศทางเก่าในเอกสาร `KMITL_EXAM_PROJECT.md` ในส่วนที่ขัดกัน
> ผมอ่านได้แค่หน้าแรกของ repo (README + รายชื่อโฟลเดอร์) ยังไม่เห็นโค้ดข้างใน **ให้อ่านโค้ดจริงก่อนเริ่มแก้** ตามหัวข้อ 2

## 0. สิ่งที่ผู้ใช้สั่ง

1. **เลิกดึงข้อมูลด้วย script** (Tampermonkey/userscript/bookmarklet) ให้ดึงข้อมูลสาธารณะ**แบบเรียลไทม์** ผ่านเซิร์ฟเวอร์ของเว็บเราเอง
2. เพิ่มฟีเจอร์ **"ตารางเรียนส่วนบุคคล"** (และตารางสอบส่วนบุคคลจากวิชาที่ลงทะเบียนจริง)

| ฟีเจอร์ | แหล่งข้อมูล | เรียลไทม์ฝั่งเซิร์ฟเวอร์? |
|---|---|---|
| ตารางสอบ/สอนรวม กรองตาม คณะ › หลักสูตร › ชั้นปี | `get-teach-table-show` (สาธารณะ ไม่ต้องล็อกอิน) | **ได้** (แต่ยังไม่ได้ทดสอบจาก Vercel — ดูหัวข้อ 4) |
| ตารางเรียนส่วนบุคคล / ตารางสอบส่วนบุคคล / ที่นั่งสอบ | `get-regis-result` (ต้องมี `Authorization: Bearer` ของผู้ใช้จาก SSO ของ REG) |  เพราะเซิร์ฟเวอร์เราไม่มี token |

## 2. งานแรก: อ่านโค้ดที่มีอยู่ (ก่อนเขียนอะไร)

เท่าที่เห็นจากหน้าแรกของ repo:

```
app/            หน้าเว็บ, metadata, global styles
components/     Navbar, theme toggle, countdown, ส่วนแสดงตาราง (list/timeline/card)
lib/            types + utility จัดกลุ่มข้อมูลการสอบ
data/source/    CSV ต้นทาง
public/data/exams.json   ← ข้อมูลที่หน้าเว็บโหลด (static JSON snapshot)
scripts/        data:csv (CSV→JSON), data:sync (ซิงก์จากแหล่งภายนอก; env YEAR, SEM, LEVEL)
kmitl-exam-api.user.js   ← userscript เก่าอยู่ใน root ของ repo
DESIGN.md, PRODUCT.md    ← ต้องอ่าน ทำตามดีไซน์/ทิศทางผลิตภัณฑ์
```

ให้อ่านและสรุปให้ผู้ใช้สั้น ๆ ก่อนลงมือ:
1. `PRODUCT.md`, `DESIGN.md`, `README.md` และกติกาโค้ดอื่น (lint, tsconfig)
2. `lib/` — type ของแถวข้อมูลสอบ และฟังก์ชันจัดกลุ่ม
3. `scripts/` — **โดยเฉพาะ `data:sync`**: มันเรียก REG จาก Node อยู่แล้วหรือไม่? ถ้าใช่ แปลว่าเรียกจากเซิร์ฟเวอร์ได้ในระดับหนึ่ง ใช้เป็นตัวอ้างอิง (แต่ Vercel อาจต่างจากเครื่องผู้ใช้)
4. `public/data/exams.json` — ดูฟิลด์ที่มี (ใน CSV เดิมมี: คณะ, หลักสูตร, ชั้นปี, รหัสวิชา, ชื่อ, หน่วยกิต, กลุ่ม, ประเภท, เวลาเรียน, ห้อง, อาจารย์, สอบกลางภาค/ปลายภาค, เงื่อนไข, รับ, ลงแล้ว, หมายเหตุ)
5. `components/` — ตารางแบบ list/timeline/card ที่มีอยู่ เพื่อใช้ซ้ำ
6. รูปแบบ URL ตัวกรองปัจจุบัน: `/?f=<คณะ>&c=<หลักสูตร>&y=<ชั้นปี>&k=<final|mid>&v=<grid|...>` ต้องไม่ทำให้ลิงก์เก่าพัง

**userscript เก่า (`kmitl-exam-api.user.js`) ใน repo:** ผู้ใช้สั่งเลิกใช้แนวนี้ ให้เสนอย้ายไป `legacy/` หรือลบ **แต่ขอยืนยันผู้ใช้ก่อนลบ**

## 3. ส่วนที่ 1 — ข้อมูลสาธารณะแบบเรียลไทม์

### API ของ REG (สาธารณะ)

```
GET https://regis.reg.kmitl.ac.th/api/?function=get-teach-table-show
    &level_id=1&mode=by_class
    &selected_year=2569&selected_semester=1
    &selected_faculty=07&selected_department=01&selected_curriculum=04&selected_class_year=1
    &search_all_faculty=false&search_all_department=false
    &search_all_curriculum=false&search_all_branch=true&search_all_class_year=false
```

- ปี/ภาคเป็น พ.ศ.; `*_date_time` ใน response เป็น ค.ศ. (`2026-11-10 13:30:00`)
- ยืนยันแล้ว: `faculty=07` คือ IT รหัสคณะอื่นยังไม่รู้ ต้องค้นพบจาก endpoint รายชื่อ (ดูหัวข้อ 4)
- ข้อสังเกตจากการรันในเบราว์เซอร์ผู้ใช้: ส่ง `selected_*` ว่าง → HTTP 400; ขอ "ทั้งคณะ" ของคณะใหญ่ (วิศวะ/วิทย์/IT) ล้มหรือค้าง; **ขอทีละชั้นปีได้ครบทุกคณะ** (สมมติฐานว่าคำขอเล็กกว่าจึงผ่าน)
- ผล: **อย่าขอ "ทั้งคณะ"** ให้ขอเท่าที่ผู้ใช้เลือก (คณะ+หลักสูตร+ชั้นปี)

### Response (ย่อ)

```jsonc
[{ "faculty_id","department_id","curriculum2_id","class",
   "faculty_name_th","department_name_th","curriculum_name_th",
   "teachtable":[{ "subject_type_name_th",
     "data":[{
       "teach_table_id","subject_id","subject_name_th","subject_name_en","credit_str","section",
       "lect_or_prac",                 // "ท" ทฤษฎี / "ป" ปฏิบัติ
       "teach_day",                    // 1=อาทิตย์ … 3=อังคาร (ยืนยันกับ time_slot แล้วว่า 3=อังคาร)
       "teach_time","teach_time2",     // "09:00:00"
       "room_name","building_name","classroom","classbuilding",
       "teacher_list_th",              // HTML → strip/sanitize
       "midterm_start_date_time","midterm_end_date_time",
       "final_start_date_time","final_end_date_time",
       "rules_th",                     // HTML เงื่อนไข เช่น "เฉพาะรหัสนักศึกษา…", ช่วงรหัส
       "remark",                       // ← แขนง/กลุ่มวิชา (หัวข้อ 3.3)
       "closed","limit","count" }] }] }]
```

### 3.1 สถาปัตยกรรม

```
Browser (UI เลือก คณะ›หลักสูตร›ชั้นปี›แขนง)
  └─ GET /api/teach-table?faculty=&department=&curriculum=&classYear=&year=&semester=&level=
       ├─ validate (whitelist: ตัวเลขล้วน ความยาวจำกัด; ปฏิเสธที่เหลือ)
       ├─ cache (ISR/CDN 5–15 นาที + stale-while-revalidate) — ตรวจ API caching ของ Next 16 ในเอกสารเวอร์ชันที่ติดตั้ง
       ├─ rate limit ต่อ IP (กันยิง REG ถี่)
       ├─ fetch REG (timeout 15–40 วินาที, retry ≤1, ไม่ส่ง cookie/token)
       ├─ normalize → แถวชนิดเดียวกับ `lib/` types เดิม (+ facultyId, departmentId, curriculumId, track, ISO keys)
       └─ ล้มเหลว → fallback `public/data/exams.json` + ป้าย "ข้อมูลล่าสุดเมื่อ …"
```

- ส่งกลับเฉพาะข้อมูลวิชา; แปลง `teacher_list_th`, `rules_th`, `remark` เป็น text ก่อนส่ง
- แสดง "อัปเดตล่าสุด" และลิงก์ไป REG ทางการเสมอ (วันสอบผิดกระทบนักศึกษาจริง)
- `npm run data:sync` ยังเก็บไว้เป็นตัวสร้าง snapshot สำรอง
- หน้า UI เดิม (ตัวกรอง/ลิงก์แชร์/countdown) ต้องทำงานเหมือนเดิม แต่ข้อมูลมาจาก API เรา

### 3.2 รายชื่อคณะ/หลักสูตร

อย่าวนเดารหัสคณะ ให้หา endpoint จริงของ dropdown ในหน้า `https://regis.reg.kmitl.ac.th/#/teach_table_selector` (เป็น SPA — ถ้าเรียกอ่านเองไม่ได้ ให้ขอผู้ใช้ส่ง Request URL จาก DevTools › Network ตอนเปิด dropdown) ระหว่างรอ ใช้รายการคณะ/หลักสูตรที่สกัดจาก `exams.json` เป็นตัวเลือกเริ่มต้น

### 3.3 แขนง/กลุ่มวิชา (ผู้ใช้แจ้งว่าเป็นปัญหาในชั้นปีสูง)

REG **ไม่มีฟิลด์แขนงแยก** แขนงถูกเขียนใน `remark` (บางส่วนใน `rules_th`) ตัวอย่าง IT ปี 3 วิชา `06016404 CLOUD COMPUTING` มี 6 กลุ่ม:

| กลุ่ม | remark |
|---|---|
| 1 (ท), 2 (ป) | เฉพาะนักศึกษา กลุ่มวิชาด้านสื่อประสมสำหรับการพัฒนาสื่อเชิงโต้ตอบ เว็บ และ เกม |
| 3 (ท), 4 (ป) | เฉพาะนักศึกษา กลุ่มวิชาด้านโครงสร้างพื้นฐานเทคโนโลยีสารสนเทศ |
| 5 (ท), 6 (ป) | เฉพาะนักศึกษา กลุ่มวิชาด้านการพัฒนาซอฟต์แวร์ |

ทั้ง 6 กลุ่มสอบเวลาเดียวกัน แต่เวลาเรียนต่างกัน ใน snapshot เดิม (4,950 แถว) มีหมายเหตุ 1,950 แถว; ~413 แถวพูดถึงแขนง/กลุ่มวิชา/สาขา/วิชาเอก (มากสุด บริหารธุรกิจ 184, ครุศาสตร์อุตสาหกรรมฯ 49, วิศวะ 39, IT 30, สถาปัตย์ฯ 26, วิศวกรรมสังคีต 26) รูปแบบข้อความ**ไม่เหมือนกันทุกคณะ** และมีหมายเหตุที่ไม่ใช่แขนงปน (`ห้อง 1`, `วิชาบังคับ-แกนวิทยาศาสตร์`, `(รายวิชาปิด/Course Close …)`)

งาน:
1. `extractTrack(remark, rules): string | null` — จับ `แขนงวิชา…`, `กลุ่มวิชาด้าน…`, `วิชาเอก…`, `เฉพาะนักศึกษา…` ตัดคำนำหน้า/HTML
2. เพิ่มฟิลด์ `track` ในข้อมูลที่ API ส่งกลับ และ `t` ใน query string ตัวกรอง (`/?f=…&c=…&y=…&t=<แขนง>`)
3. **dump รายการแขนงที่ตรวจพบต่อ คณะ/หลักสูตร/ชั้นปี ให้ผู้ใช้ตรวจก่อนเปิดใช้** ห้ามเดาว่า regex ถูกทุกคณะ
4. UI: ขั้น "แขนง" ต่อท้าย ขึ้นเฉพาะเมื่อชุดนั้นมีแขนง ≥ 2 แบบ มี "ทุกแขนง"; **วิชาที่ `track = null` ต้องแสดงเสมอ**
5. แสดง `remark` ดิบเป็นป้ายเล็ก ๆ ให้ผู้ใช้ตรวจเอง

## 4. งานก่อนเขียน UI: ทดสอบความเป็นไปได้ (ต้องรายงานผู้ใช้)

1. ในสภาพแวดล้อมที่เป็นตัวแทน Vercel (หรือ route ทดลองที่ deploy preview) เรียก URL ตัวอย่าง (คณะ 07 ชั้นปี 1) ตรวจ status, เวลาตอบ, ขนาด, `content-type`
2. ลองคณะใหญ่ (วิศวะ ชั้นปี 3) แบบเลือกหลักสูตร+ชั้นปี ว่าทันภายใน timeout และไม่เกิน limit ของ serverless function ของแพ็กเกจ Vercel ที่ใช้
3. ดูว่า `data:sync` ที่มีอยู่ทำงานอย่างไร
4. **สรุปผล ผ่าน/ไม่ผ่าน** ให้ผู้ใช้ก่อนทำต่อ ถ้าไม่ผ่าน เสนอทางเลือก (ขอสิทธิ์สำนักทะเบียน, cron สร้าง snapshot บ่อยขึ้น, ปุ่มรีเฟรชสำหรับผู้ดูแล) — ไม่เลี่ยงข้อจำกัดเอง

## 5. ส่วนที่ 2 — ตารางเรียนส่วนบุคคล (และตารางสอบส่วนบุคคล)

### 5.1 ข้อมูลที่ใช้

`get-regis-result` ให้ครบในที่เดียว

```
GET /api/?function=get-regis-result&student_id=<ของผู้ใช้เอง>&year=2569&semester=1&level_id=1
Headers: Authorization: Bearer <token ของผู้ใช้ — เราไม่แตะ>
→ [ {
  "TEACH_TABLE_ID","year","semester","subject_id","section","lect_or_prac",
  "teach_day","teach_time","teach_time2","teachtime_str",           // ตารางเรียนรายสัปดาห์
  "mexam_date","mexam_time","mexam_time2",                          // สอบกลางภาค
  "exam_date","exam_time","exam_time2",                             // สอบปลายภาค
  "room_no","building_no","classroom","classbuilding",              // ห้องเรียน
  "subject_tname","subject_ename","credit","lect_hr","prac_hr","self_hr",
  "teacher_list_th","teacher_list_en",                              // HTML
  "exam_seats": { "M": {room_name,building_name,row,col,...}, "F": {...} },  // ห้อง/ที่นั่งสอบ
  "time_slot": [ {"START_DATE_TIME","END_DATE_TIME"}, … ],          // วันเรียนจริงทุกสัปดาห์ (ข้ามวันหยุด)
  "sec_pair","LIMIT","COUNT"
} ]
```

ใช้ได้ทั้ง **ตารางเรียน** (`teach_day` + `teach_time`..`teach_time2` + ห้อง + `time_slot`), **ตารางสอบ** (`mexam_*`, `exam_*`) และ **ที่นั่งสอบ** (`exam_seats`) จาก response เดียว


### 5.2 ฟีเจอร์ที่ต้องทำ (ฝั่งไคลเอนต์ล้วน)

2. `parseRegistration(json)` → `RegistrationRow[]` พร้อม validate/clip ทุกฟิลด์ (ข้อมูลอินพุตไม่น่าเชื่อถือ) แปลง HTML เป็น text 
3. **ตารางเรียนรายสัปดาห์** — กริด จันทร์–อาทิตย์ × ช่วงเวลา บล็อกแสดง รหัส/ชื่อวิชา กลุ่ม ห้อง/ตึก (ท/ป) เมื่อวิชาชนกันให้แสดงเตือน; มุมมองรายการสำหรับมือถือ (การ์ด ตาม DESIGN.md)
   - `teach_day`: 1=อาทิตย์, 2=จันทร์, … 7=เสาร์ (ยืนยันแล้วว่า 3=อังคาร ด้วย `time_slot`)
4. **ตารางสอบส่วนบุคคล** — รวมกลางภาค/ปลายภาค เรียงตามเวลา + countdown ที่มีอยู่แล้ว + ห้อง/แถว/ที่นั่งจาก `exam_seats` (ถ้ามี; ถ้าไม่มีให้บอกว่ายังไม่ประกาศ ห้ามเอาห้องเรียนมาแสดงเป็นห้องสอบโดยไม่ติดป้าย)
5. ตรวจเวลาสอบทับกัน
6. ส่งออก `.ics`: ตารางเรียนจาก `time_slot` (หนึ่งอีเวนต์ต่อวันเรียนจริง, `TZID=Asia/Bangkok`) และตารางสอบ (มี `VALARM` ล่วงหน้า 1 วัน)
7. ไม่เก็บข้อมูลถาวรโดยค่าเริ่มต้น (อยู่ใน state เท่านั้น); ถ้าจะทำ "จำไว้ในเครื่อง" ต้องเป็น **opt-in** ด้วย `localStorage` พร้อมปุ่มล้าง และบอกผู้ใช้ชัดเจน

### 5.4 โค้ดอ้างอิงที่มีอยู่แล้ว (ผู้ใช้จะแนบ)

`ischedule-my-exam.js` มี `buildEvents`, `findConflicts`, `makeICS`, `validateEvents` สำหรับตารางสอบ (ES module, ไม่พึ่ง DOM) ให้พอร์ตเป็น TypeScript ใน `lib/` แล้วขยายให้รองรับตารางเรียน (`teach_*`, `time_slot`)

## 6. ลำดับงานที่แนะนำ

1. อ่าน repo + สรุปให้ผู้ใช้ (หัวข้อ 2)
2. ทดสอบเรียก REG จาก Vercel/Node และรายงาน (หัวข้อ 4)
3. API route `/api/teach-table` + cache/rate limit/fallback (3.1)
4. endpoint รายชื่อคณะ/หลักสูตร (3.2) → ต่อกับตัวกรองเดิม
5. `extractTrack` + dump ให้ผู้ใช้ตรวจ → ตัวกรองแขนง (3.3)
6. หน้า `/my` + ตารางเรียน/สอบส่วนบุคคลฝั่งไคลเอนต์ (5.3)
7. ล้าง userscript เก่า (ยืนยันผู้ใช้ก่อน), อัปเดต README (ที่มาข้อมูล = REG, ข้อจำกัด, ความเป็นส่วนตัว)

## 7. เกณฑ์ว่างานเสร็จ

- [ ] ผลทดสอบข้อ 4 รายงานผู้ใช้แล้ว และตกลงแนวทางต่อ
- [ ] `/api/teach-table` ใช้งานได้ มี validation, cache, rate limit, timeout, fallback, "อัปเดตล่าสุด"
- [ ] ผลเรียลไทม์ตรงกับ snapshot เดิมสำหรับ ≥ 3 คณะ (หรืออธิบายส่วนต่างได้)
- [ ] ตัวกรองแขนงใช้ได้ และรายการแขนงที่ตรวจพบผ่านการตรวจโดยผู้ใช้
- [ ] `/my` ทำงานได้โดยไม่มีคำขอเครือข่ายใด ๆ ที่มีข้อมูลผู้ใช้ (ตรวจใน DevTools Network)
- [ ] ตารางเรียน/สอบส่วนบุคคล + ที่นั่งสอบ + `.ics` ถูกต้องเมื่อเทียบกับหน้า REG ของผู้ใช้เอง (ผู้ใช้ตรวจ)
- [ ] ไม่มีโค้ดที่เก็บ/รับ token, ไม่มีข้อมูลรายคนใน `public/`, `npm run typecheck` และ `npm run build` ผ่าน
- [ ] README อธิบายแหล่งข้อมูล ข้อจำกัด นโยบายความเป็นส่วนตัว และเงื่อนไข "ตรวจกับประกาศทางการก่อนสอบ"

## 8. ถามผู้ใช้เมื่อไม่แน่ใจ

- ต้องการเก็บ `kmitl-exam-api.user.js` ไว้ใน `legacy/` หรือลบ
