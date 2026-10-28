import type { Metadata, Viewport } from "next";
import { IntroScreen } from "@/components/intro-screen";
import { AuthProvider } from "@/components/auth-provider";
import { LanguageProvider } from "@/components/language-provider";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ischedule-arak.vercel.app";
const defaultTitle = "ตารางสอบ KMITL | ischedule";
const defaultDescription = "ค้นหาตารางสอบกลางภาคและตารางสอบปลายภาค KMITL แยกตามคณะ หลักสูตร และชั้นปี";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl), title: defaultTitle, description: defaultDescription,
  keywords: ["ตารางสอบกลางภาค", "ตารางสอบปลายภาค", "KMITL", "สจล.", "IT"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", title: defaultTitle, description: defaultDescription, url: siteUrl, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: defaultTitle }], locale: "th_TH" },
  twitter: { card: "summary_large_image", title: defaultTitle, description: defaultDescription, images: ["/opengraph-image"] },
  icons: { icon: "/schedule-icon.svg", apple: "/schedule-icon.svg" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="th"><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" /></head><body suppressHydrationWarning><LanguageProvider><IntroScreen /><AuthProvider>{children}</AuthProvider></LanguageProvider></body></html>;
}
