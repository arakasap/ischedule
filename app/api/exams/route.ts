import { NextRequest, NextResponse } from "next/server";
import { getFilteredDataset } from "@/lib/exams";
import type { ExamKind } from "@/lib/types";

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const kind = params.get("kind");
  const year = params.get("year");
  const dataset = getFilteredDataset({
    faculty: params.get("faculty") ?? undefined,
    curriculum: params.get("curriculum") ?? undefined,
    kind: kind === "midterm" || kind === "final" ? kind as ExamKind : undefined,
    year: year ? Number(year) : undefined,
  });
  return NextResponse.json(dataset, {
    headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400" },
  });
}
