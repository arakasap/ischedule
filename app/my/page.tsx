import type { Metadata } from "next";
import { MyScheduleApp } from "@/components/my-schedule-app";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = {
  title: "ตารางของฉัน · <i>schedule",
  description: "สร้างตารางสอบส่วนตัวจากรหัสวิชาที่เลือก",
};

export default function MyPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <MyScheduleApp />
      <footer className="page-footer border-t border-line bg-surface px-4 py-6 text-center text-xs text-ink-2">รายการวิชาของคุณถูกเก็บไว้ในเบราว์เซอร์นี้เท่านั้น</footer>
    </div>
  );
}
