import { HomeAuthGate } from "@/components/home-auth-gate";
import { SchedulePage } from "@/components/schedule-page";
import { getDefaultExamSelection } from "@/lib/exam-page";
import { getExamRouteEntries } from "@/lib/exams";

export default function Home() {
  const selection = getDefaultExamSelection("final");
  const jsonLd = JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "ischedule", url: "https://ischedule-arak.vercel.app", inLanguage: "th-TH" }).replace(/</g, "\\u003c");
  return <><HomeAuthGate><SchedulePage initialData={selection.data} filterOptions={selection.filterOptions} initialFaculty={selection.faculty} initialCurriculum={selection.curriculum} initialYear={selection.year} initialKind={selection.kind} internalLinks={getExamRouteEntries()} /></HomeAuthGate><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} /></>;
}
