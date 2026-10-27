# Supabase Google Auth

## Environment variables

คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ค่าจาก Supabase Project Settings → API:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

โปรเจกต์ Supabase รุ่นเก่าอาจใช้ชื่อ `NEXT_PUBLIC_SUPABASE_ANON_KEY` แทนได้

## Supabase Dashboard

1. เปิด Authentication → Providers → Google แล้วเปิดใช้งาน Google Provider
2. สร้าง OAuth Client ID แบบ **Web application** ใน Google Cloud Console
3. นำ Google OAuth **Client ID** มาใส่ในช่อง `Client IDs` และ **Client Secret** มาใส่ในช่อง `Client Secret` ของ Supabase
4. นำ Callback URL ที่ Supabase แสดงในหน้านี้ไปใส่ใน Google Cloud → Authorized redirect URIs (ต้องคัดลอกให้ตรงทุกตัวอักษร)
5. เพิ่ม Redirect URL ใน Authentication → URL Configuration:
   - `http://localhost:3000/my`
   - URL production ของเว็บ เช่น `https://ischedule.example.com/my`
6. ตั้ง Site URL เป็น URL หลักของเว็บ

ระบบจะส่ง `hd=kmitl.ac.th` ไปเป็น Google Workspace hint และตรวจสอบอีเมลซ้ำหลัง Login สำเร็จ โดยอนุญาตเฉพาะอีเมลที่ลงท้ายด้วย `@kmitl.ac.th` เท่านั้น

ห้ามนำ `service_role` key มาใส่ใน `NEXT_PUBLIC_*` หรือในโค้ดฝั่ง browser
