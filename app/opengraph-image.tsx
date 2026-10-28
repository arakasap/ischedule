import { ImageResponse } from "next/og";

export const alt = "ตารางสอบ KMITL | ischedule";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const font = await fetch(new URL("https://fonts.gstatic.com/s/notosansthai/v25/-nF7OG829Oofr2wohFbTp9iFOkMQAewlpbGXhhyYs0QF3kPVyLylzU95v8Q.woff2"), { signal: AbortSignal.timeout(3000) }).then((response) => response.ok ? response.arrayBuffer() : null).catch(() => null);
  const options = font ? { fonts: [{ name: "Noto Sans Thai", data: font, weight: 400 as const }, { name: "Noto Sans Thai", data: font, weight: 700 as const }] } : {};
  return new ImageResponse(<div style={{ background: "#fff7ed", color: "#431407", display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", padding: "72px 84px", width: "100%", fontFamily: "Noto Sans Thai, Arial" }}><div style={{ color: "#c2410c", fontSize: 32, fontWeight: 700 }}>&lt;i&gt;schedule</div><div style={{ fontSize: 64, fontWeight: 700, marginTop: 22 }}>ตารางสอบ KMITL</div><div style={{ color: "#7c2d12", fontSize: 34, marginTop: 18 }}>ตารางสอบกลางภาคและปลายภาค สำหรับนักศึกษา IT</div><div style={{ background: "#fed7aa", borderRadius: 18, color: "#9a3412", display: "flex", fontSize: 24, marginTop: 54, padding: "14px 24px", width: "fit-content" }}>ค้นหาแยกตามคณะ หลักสูตร และชั้นปี</div></div>, { ...size, ...options });
}
