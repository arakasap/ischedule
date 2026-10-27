"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type ExamGroup, DOW, dateParts, sectionsOf, thaiDate } from "@/lib/exam-utils";

interface Props {
  groups: ExamGroup[];
  spotlight?: boolean;
}

interface UpcomingExam {
  group: ExamGroup;
  start: Date;
  end: Date;
}

function asLocalDate(group: ExamGroup, minutes: number): Date {
  const { y, m, d } = dateParts(group.info.date);
  return new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60, 0, 0);
}

function findUpcoming(groups: ExamGroup[], now: Date): UpcomingExam | null {
  const sorted = [...groups].sort((a, b) => a.info.sortKey.localeCompare(b.info.sortKey));
  for (const group of sorted) {
    const start = asLocalDate(group, group.info.startMin);
    const end = asLocalDate(group, group.info.endMin);
    if (now < start) return { group, start, end };
    if (now < end) continue;
  }
  return null;
}

function formatCountdown(milliseconds: number): { days: string; hours: string; minutes: string; seconds: string } {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

export function ExamCountdown({ groups, spotlight = true }: Props) {
  const [now, setNow] = useState(() => new Date());
  const cardRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!spotlight) return;
    let returnTimer: number | undefined;
    let revealTimer: number | undefined;
    let cleanupTimer: number | undefined;

    function spotlightCountdown() {
      const card = cardRef.current;
      if (!card || card.classList.contains("countdown-spotlight-flight")) return;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // Keep the spotlight on screen long enough to read the subject and exam time.
      const centerPause = reducedMotion ? 1400 : 2600;
      document.documentElement.dataset.countdownStage = "spotlight";
      card.style.setProperty("--countdown-target-width", `${card.getBoundingClientRect().width}px`);
      card.classList.add("countdown-spotlight-flight");
      window.dispatchEvent(new Event("spotlight-started"));

      returnTimer = window.setTimeout(() => {
        document.documentElement.dataset.countdownStage = "returning";
        card.classList.add("countdown-spotlight-return");
      }, centerPause);

      cleanupTimer = window.setTimeout(() => {
        card.classList.remove("countdown-spotlight-flight", "countdown-spotlight-return");
        card.style.removeProperty("--countdown-target-width");
        card.classList.add("countdown-card-reveal");
        window.requestAnimationFrame(() => card.classList.add("countdown-card-reveal-visible"));
        document.documentElement.dataset.countdownStage = "complete";
        revealTimer = window.setTimeout(() => card.classList.remove("countdown-card-reveal", "countdown-card-reveal-visible"), 500);
      }, centerPause + 360);
    }

    // Put the clean stage in place before the intro disappears, so there is
    // no frame where the page content flashes behind the spotlight card.
    const introDone = document.documentElement.dataset.introDone === "true";
    if (cardRef.current && !introDone) {
      document.documentElement.dataset.countdownReady = "true";
      document.documentElement.dataset.countdownStage = "spotlight-ready";
      window.addEventListener("intro-complete", spotlightCountdown);
    }

    return () => {
      window.removeEventListener("intro-complete", spotlightCountdown);
      if (document.documentElement.dataset.introDone !== "true") {
        delete document.documentElement.dataset.countdownReady;
      }
      if (returnTimer) window.clearTimeout(returnTimer);
      if (revealTimer) window.clearTimeout(revealTimer);
      if (cleanupTimer) window.clearTimeout(cleanupTimer);
    };
  }, [spotlight]);

  const upcoming = useMemo(() => findUpcoming(groups, now), [groups, now]);
  if (!upcoming) {
    return (
      <section ref={cardRef} aria-label="สถานะการสอบ" className="countdown-card surface-lift rounded-2xl border border-accent/30 bg-accent px-4 py-6 text-center text-accent-ink sm:px-6">
        <p className="text-sm font-medium opacity-85">ตารางสอบที่เลือก</p>
        <p className="mt-1 text-2xl font-bold">สอบครบทุกวิชาแล้ว</p>
      </section>
    );
  }

  const remaining = formatCountdown(upcoming.start.getTime() - now.getTime());
  const p = dateParts(upcoming.group.info.date);
  const blocks = [
    [remaining.days, "วัน"],
    [remaining.hours, "ชม."],
    [remaining.minutes, "นาที"],
    [remaining.seconds, "วินาที"],
  ];

  return (
    <section ref={cardRef} aria-label="นับถอยหลังวิชาที่จะสอบถัดไป" className="countdown-card surface-lift overflow-hidden rounded-2xl border border-accent/30 bg-accent px-4 py-5 text-accent-ink sm:px-6 sm:py-6">
      <div className="countdown-card-content relative flex flex-col items-center text-center">
        <p className="text-sm font-medium tracking-wide opacity-90">เหลือเวลาอ่านหนังสืออีก</p>
        <div className="countdown-card-timer mt-4 grid w-full max-w-2xl grid-cols-4 gap-1.5 sm:gap-3" aria-live="polite" aria-atomic="true">
          {blocks.map(([value, label]) => (
            <div key={label} className="countdown-unit rounded-xl border border-white/10 bg-black/10 px-1 py-2.5 shadow-sm sm:px-3 sm:py-3.5">
              <strong className="block font-mono text-[1.65rem] font-semibold leading-none tabular-nums tracking-tight sm:text-4xl">{value}</strong>
              <span className="mt-1 block text-[0.65rem] font-medium opacity-80 sm:text-xs">{label}</span>
            </div>
          ))}
        </div>
        <div className="countdown-card-details mt-4 w-full max-w-2xl rounded-xl border border-white/15 bg-black/10 px-3 py-3 text-left sm:mt-5 sm:px-4">
          <p className="font-mono text-xs font-medium opacity-85">{upcoming.group.code} · {upcoming.group.info.label}</p>
          <h2 className="mt-1.5 break-words text-base font-bold leading-snug sm:text-xl">{upcoming.group.name}</h2>
          <p className="mt-1 text-xs opacity-85">{DOW[p.dow]} {thaiDate(upcoming.group.info.date)} · กลุ่ม {sectionsOf(upcoming.group)}</p>
        </div>
      </div>
    </section>
  );
}
