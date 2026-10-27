import type { Metadata } from "next";
import { SchedulePage } from "@/components/schedule-page";

export const metadata: Metadata = {
  title: "ตารางสอบ KMITL | iSchedule",
  description: "ค้นหาตารางสอบ KMITL แยกตามคณะ หลักสูตร และชั้นปี",
  alternates: { canonical: "/schedule" },
};

export default function ScheduleRoute() {
  return <SchedulePage />;
}
