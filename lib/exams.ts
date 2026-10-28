import snapshot from "../public/data/exams.json";
import type { Dataset, ExamKind, Offering } from "./types";

export type ExamFilter = {
  faculty?: string;
  kind?: ExamKind;
  year?: number;
  curriculum?: string;
};

export type ExamFilterOptions = {
  faculties: string[];
  curriculums: Record<string, string[]>;
  years: Record<string, number[]>;
};

export type ExamRouteEntry = { type: ExamKind; faculty: string; year: number };

const dataset = snapshot as Dataset;

export function getExamDataset(): Dataset {
  return dataset;
}

export function getExamFilterOptions(): ExamFilterOptions {
  const faculties = [...new Set(dataset.rows.map((row) => row.faculty))].sort((a, b) => a.localeCompare(b, "th"));
  const curriculums: Record<string, string[]> = {};
  const years: Record<string, number[]> = {};

  for (const faculty of faculties) {
    curriculums[faculty] = [...new Set(dataset.rows.filter((row) => row.faculty === faculty).map((row) => row.curriculum))]
      .sort((a, b) => a.localeCompare(b, "th"));
    for (const curriculum of curriculums[faculty]) {
      const key = `${faculty}::${curriculum}`;
      years[key] = [...new Set(dataset.rows
        .filter((row) => row.faculty === faculty && row.curriculum === curriculum)
        .map((row) => row.classYear))].sort((a, b) => a - b);
    }
    years[`${faculty}::__all__`] = [...new Set(dataset.rows.filter((row) => row.faculty === faculty).map((row) => row.classYear))]
      .sort((a, b) => a - b);
  }

  return { faculties, curriculums, years };
}

export function filterExamRows(filter: ExamFilter): Offering[] {
  return dataset.rows.filter((row) => {
    if (filter.faculty && row.faculty !== filter.faculty) return false;
    if (filter.curriculum && row.curriculum !== filter.curriculum) return false;
    if (filter.year !== undefined && row.classYear !== filter.year) return false;
    if (filter.kind && row[filter.kind] === null) return false;
    return true;
  });
}

export function getFilteredDataset(filter: ExamFilter): Dataset {
  return { ...dataset, rows: filterExamRows(filter) };
}

export function getExamRouteEntries(): ExamRouteEntry[] {
  const entries: ExamRouteEntry[] = [];
  for (const faculty of getExamFilterOptions().faculties) {
    for (const type of ["midterm", "final"] as const) {
      for (const year of getExamFilterOptions().years[`${faculty}::__all__`] ?? []) {
        const rows = filterExamRows({ faculty, kind: type, year });
        if (rows.some((row) => row[type] !== null)) entries.push({ type, faculty, year });
      }
    }
  }
  return entries;
}

export function facultySlug(faculty: string): string {
  const index = getExamFilterOptions().faculties.indexOf(faculty);
  return `faculty-${index < 0 ? "unknown" : index}`;
}

export function facultyFromSlug(slug: string): string | undefined {
  return getExamFilterOptions().faculties.find((faculty) => facultySlug(faculty) === slug);
}

export function snapshotLastModified(): Date {
  return new Date(`${dataset.meta.fetchedAt}T00:00:00.000Z`);
}

export function examRouteHref(type: ExamKind, faculty: string, year: number): string {
  return `/exam/${type}/${facultySlug(faculty)}/${year}`;
}
