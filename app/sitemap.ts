import type { MetadataRoute } from "next";
import { examRouteHref, getExamRouteEntries, snapshotLastModified } from "@/lib/exams";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ischedule-arak.vercel.app").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = snapshotLastModified();
  const routes = getExamRouteEntries().map((entry) => ({ url: `${siteUrl}${examRouteHref(entry.type, entry.faculty, entry.year)}`, lastModified, changeFrequency: "daily" as const, priority: 0.8 }));
  return [{ url: siteUrl, lastModified, changeFrequency: "daily", priority: 1 }, ...routes];
}
