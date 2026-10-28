import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SchedulePage } from "@/components/schedule-page";
import { examRouteHref, facultyFromSlug, facultySlug, getExamFilterOptions, getExamRouteEntries, getFilteredDataset } from "@/lib/exams";
import { buildExamGroups } from "@/lib/exam-utils";
import type { ExamKind } from "@/lib/types";

export const dynamicParams = false;

type Params = { type: string; faculty: string; year: string };

function getPageParams(params: Params) {
  const type = params.type === "midterm" || params.type === "final" ? params.type as ExamKind : undefined;
  const faculty = facultyFromSlug(params.faculty);
  const year = Number(params.year);
  if (!type || !faculty || !Number.isInteger(year)) return null;
  const rows = getFilteredDataset({ faculty, year, kind: type }).rows;
  if (!rows.some((row) => row[type] !== null)) return null;
  return { type, faculty, year };
}

export function generateStaticParams(): Params[] {
  return getExamRouteEntries().map((entry) => ({ type: entry.type, faculty: facultySlug(entry.faculty), year: String(entry.year) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolved = getPageParams(await params);
  if (!resolved) return {};
  const kind = resolved.type === "final" ? "ปลายภาค" : "กลางภาค";
  const title = `ตารางสอบ${kind} ${resolved.faculty} KMITL ปี ${resolved.year} | ischedule`;
  const description = `ตารางสอบ${kind} KMITL ${resolved.faculty} ชั้นปี ${resolved.year} ภาคการศึกษา 1 ปีการศึกษา 2569 พร้อมวัน เวลา และรายวิชา`;
  const url = `https://ischedule-arak.vercel.app${examRouteHref(resolved.type, resolved.faculty, resolved.year)}`;
  return { title, description, alternates: { canonical: url }, openGraph: { type: "website", title, description, url, locale: "th_TH", images: [{ url: "https://ischedule-arak.vercel.app/opengraph-image", width: 1200, height: 630, alt: title }] }, twitter: { card: "summary_large_image", title, description, images: ["https://ischedule-arak.vercel.app/opengraph-image"] } };
}

export default async function ExamRoute({ params }: { params: Promise<Params> }) {
  const resolved = getPageParams(await params);
  if (!resolved) notFound();
  const data = getFilteredDataset({ faculty: resolved.faculty, year: resolved.year, kind: resolved.type });
  const groups = buildExamGroups(data.rows, resolved.type).scheduled;
  const kindLabel = resolved.type === "final" ? "ปลายภาค" : "กลางภาค";
  const jsonLd = { "@context": "https://schema.org", "@type": "ItemList", name: `ตารางสอบ${kindLabel} ${resolved.faculty} ปี ${resolved.year}`, numberOfItems: groups.length, itemListElement: groups.map((group, index) => ({ "@type": "ListItem", position: index + 1, name: group.name, url: `https://ischedule-arak.vercel.app${examRouteHref(resolved.type, resolved.faculty, resolved.year)}#${group.code}` })) };
  const safeJsonLd = JSON.stringify(jsonLd).replace(/</g, "\\u003c");
  return <><SchedulePage initialData={data} filterOptions={getExamFilterOptions()} initialFaculty={resolved.faculty} initialCurriculum="__all__" initialYear={String(resolved.year)} initialKind={resolved.type} heading={`ตารางสอบ${kindLabel} ${resolved.faculty} KMITL ปี ${resolved.year}`} description={`ตารางสอบ${kindLabel} KMITL ภาคเรียนที่ ${data.meta.term} อัปเดตล่าสุด ${data.meta.fetchedAt}`} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd }} /></>;
}
