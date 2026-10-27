import type { Metadata, Viewport } from "next";
import { IntroScreen } from "@/components/intro-screen";
import { AuthProvider } from "@/components/auth-provider";
import { LanguageProvider } from "@/components/language-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "<i>schedule · ตารางสอบ KMITL",
  description: "ค้นหาตารางสอบ KMITL แยกตามคณะ หลักสูตร และชั้นปี",
  icons: {
    icon: "/schedule-icon.svg",
    apple: "/schedule-icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap"
        />
      </head>
      <body suppressHydrationWarning>
        <LanguageProvider>
          <IntroScreen />
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
