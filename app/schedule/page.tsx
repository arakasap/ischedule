import type { Metadata } from "next";
import { SchedulePage } from "@/components/schedule-page";
import { getDefaultExamSelection } from "@/lib/exam-page";

export const metadata: Metadata = {
  title: "ตารางสอบ KMITL | ischedule",
  description: "ค้นหาตารางสอบกลางภาคและปลายภาค KMITL แยกตามคณะ หลักสูตร และชั้นปี",
  alternates: { canonical: "/" },
};

export default function ScheduleRoute() {
  const selection = getDefaultExamSelection("final");
  return <SchedulePage initialData={selection.data} filterOptions={selection.filterOptions} initialFaculty={selection.faculty} initialCurriculum={selection.curriculum} initialYear={selection.year} initialKind={selection.kind} />;
}
