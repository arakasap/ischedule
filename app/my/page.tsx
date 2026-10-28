import type { Metadata } from "next";
import { MyScheduleApp } from "@/components/my-schedule-app";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = {
  title: "ตารางสอบของฉัน | ischedule",
  description: "สร้างตารางสอบส่วนตัวจากรหัสวิชาที่เลือก",
  robots: { index: false, follow: false },
};

export default function MyPage() {
  return <div className="min-h-screen"><SiteNav /><MyScheduleApp /><footer className="page-footer border-t border-line bg-surface px-4 py-6 text-center text-xs text-ink-2">ตารางส่วนตัวนี้เก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น</footer></div>;
}
