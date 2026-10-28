import { biggestCurriculum, facultyList, yearList } from "@/lib/exam-utils";
import { getExamDataset, getExamFilterOptions, getFilteredDataset } from "@/lib/exams";
import type { ExamKind } from "@/lib/types";

export function getDefaultExamSelection(kind: ExamKind = "final") {
  const dataset = getExamDataset();
  const faculties = facultyList(dataset.rows);
  const faculty = faculties.find((item) => item.includes("เทคโนโลยีสารสนเทศ")) ?? faculties[0] ?? "";
  const curriculum = biggestCurriculum(dataset.rows, faculty);
  const years = yearList(dataset.rows, faculty, curriculum);
  const year = years.includes(1) ? "1" : String(years[0] ?? "__all__");
  return { kind, faculty, curriculum, year, data: getFilteredDataset({ faculty, curriculum, year: Number(year), kind }), filterOptions: getExamFilterOptions() };
}
