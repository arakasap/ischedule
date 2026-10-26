# `<i>schedule`

ตารางสอบ KMITL ที่ช่วยให้การวางแผนอ่านหนังสือเป็นเรื่องง่ายขึ้น

`<i>schedule` คือเว็บแอปสำหรับค้นหาและดูตารางสอบแบบเข้าใจง่าย รองรับทั้งมุมมองรายการและไทม์ไลน์ พร้อมนับถอยหลังสู่วิชาถัดไป เพื่อให้รู้ว่ามีเวลาเตรียมตัวเหลือเท่าไรในแต่ละช่วง

## จุดเด่น

- กรองตารางสอบตามคณะ หลักสูตร ชั้นปี และประเภทการสอบ
- ดูตารางได้ 2 แบบ: รายการและไทม์ไลน์
- Countdown ไปยังการสอบครั้งถัดไปแบบเรียลไทม์
- แสดงประเภทการสอบอย่างชัดเจน: `(ท)` ทฤษฎี และ `(ป)` ปฏิบัติ
- ตารางบนมือถือและ iPad เปลี่ยนเป็นการ์ดที่อ่านง่าย พร้อมเลื่อนดู timeline ได้สะดวก
- Dark mode พร้อม animation ที่นุ่มนวล
- Navbar แบบ sticky ที่ย่อเป็น floating pill เมื่อเลื่อนหน้า
- แชร์ลิงก์ผลการค้นหาผ่าน URL ได้ทันที
- มี loading screen และรองรับ `prefers-reduced-motion`

## เทคโนโลยี

| ส่วน | เทคโนโลยี |
| --- | --- |
| Framework | Next.js 16 · App Router |
| UI | React 19 · TypeScript 5 |
| Styling | Tailwind CSS 4 · CSS Variables |
| Data | Static JSON snapshot |
| Runtime | Node.js หรือ Bun |

## เริ่มต้นใช้งาน

ต้องใช้ Node.js 20+ หรือ Bun เวอร์ชันปัจจุบัน

```bash
# ติดตั้ง dependencies
npm install

# เปิด development server
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) ในเบราว์เซอร์

ถ้าใช้ Bun:

```bash
bun install
bun run dev
```

## คำสั่งที่ใช้บ่อย

```bash
npm run dev        # เปิด development server
npm run typecheck  # ตรวจสอบ TypeScript
npm run build      # สร้าง production build
npm run start      # รัน production server
```

## การอัปเดตข้อมูลตารางสอบ

ข้อมูลที่หน้าเว็บใช้ถูกเก็บไว้ที่ [`public/data/exams.json`](./public/data/exams.json)

### แปลง CSV เป็น JSON

วางไฟล์ CSV ไว้ที่ [`data/source/`](./data/source/) แล้วรัน:

```bash
npm run data:csv
```

หรือระบุไฟล์และภาคการศึกษาเอง:

```bash
bun run data:csv path/to/exams.csv 1/2569
```

### ซิงก์ข้อมูลจากแหล่งข้อมูลภายนอก

```bash
npm run data:sync
```

สามารถกำหนดค่า `YEAR`, `SEM` และ `LEVEL` ตามการตั้งค่าของสคริปต์ได้

> ตรวจสอบข้อมูลก่อน commit ทุกครั้ง เพราะตารางสอบเป็นข้อมูลที่อาจเปลี่ยนแปลงได้

## โครงสร้างโปรเจกต์

```text
app/                  หน้าเว็บหลัก, metadata และ global styles
components/           Navbar, theme toggle, countdown และส่วนแสดงตาราง
lib/                  types และ utility สำหรับจัดกลุ่มข้อมูลการสอบ
data/source/          ไฟล์ CSV ต้นทาง
public/data/          JSON ที่หน้าเว็บโหลดไปใช้งาน
public/                static assets เช่น favicon
scripts/               เครื่องมือแปลงและซิงก์ข้อมูล
```

## รูปแบบ URL

ตัวกรองและมุมมองปัจจุบันจะถูกเก็บไว้ใน query string ทำให้คัดลอกหรือแชร์ลิงก์ได้ เช่น:

```text
/?f=คณะ&c=หลักสูตร&y=1&k=final&v=grid
```

## การเผยแพร่

โปรเจกต์นี้สามารถ deploy บนแพลตฟอร์มที่รองรับ Next.js ได้ เช่น Vercel โดยใช้คำสั่ง build มาตรฐาน:

```bash
npm run build
npm run start
```

## ผู้พัฒนา

สร้างโดย [arakasap](https://github.com/arakasap)

- GitHub: [github.com/arakasap](https://github.com/arakasap)
- Instagram: [@arakasap](https://instagram.com/arakasap)

---

<p align="center">Made for clearer exam planning · <code>&lt;i&gt;schedule</code></p>
