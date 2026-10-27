"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

type IntroState = "visible" | "leaving" | "hidden";

export function IntroScreen() {
  const [state, setState] = useState<IntroState>("visible");
  const pathname = usePathname();
  const isPersonal = pathname === "/my";

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const resetScroll = window.requestAnimationFrame(() => window.scrollTo(0, 0));
    const resetTimer = window.setTimeout(() => window.scrollTo(0, 0), 0);

    return () => {
      window.cancelAnimationFrame(resetScroll);
      window.clearTimeout(resetTimer);
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const leaveAfter = reducedMotion ? 120 : 1150;
    const removeAfter = reducedMotion ? 180 : 1650;
    let spotlightListener: (() => void) | undefined;
    let spotlightHideTimer: number | undefined;
    const finishIntro = () => {
      document.documentElement.dataset.introDone = "true";
      window.dispatchEvent(new Event("intro-complete"));
      setState("hidden");
    };
    const leaveTimer = window.setTimeout(() => {
      window.scrollTo(0, 0);
      const waitingForSpotlight = isPersonal && document.documentElement.dataset.countdownReady === "true";
      if (!waitingForSpotlight) setState("leaving");
    }, leaveAfter);
    const removeTimer = window.setTimeout(() => {
      if (isPersonal && document.documentElement.dataset.countdownReady === "true") {
        spotlightListener = () => {
          document.documentElement.dataset.introDone = "true";
          setState("leaving");
          spotlightHideTimer = window.setTimeout(() => setState("hidden"), reducedMotion ? 0 : 500);
        };
        window.addEventListener("spotlight-started", spotlightListener, { once: true });
        window.dispatchEvent(new Event("intro-complete"));
      } else {
        finishIntro();
      }
    }, removeAfter);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);
      if (spotlightHideTimer) window.clearTimeout(spotlightHideTimer);
      if (spotlightListener) window.removeEventListener("spotlight-started", spotlightListener);
    };
  }, [isPersonal]);

  if (state === "hidden") return null;

  return (
    <div className={`intro-screen intro-screen-${state}`} role="status" aria-live="polite" aria-label={isPersonal ? "กำลังเปิดตารางสอบส่วนตัว" : "กำลังเปิด <i>schedule"}>
      <div className="intro-glow intro-glow-one" aria-hidden="true" />
      <div className="intro-glow intro-glow-two" aria-hidden="true" />
      <div className="intro-content">
        <div className="intro-mark" aria-hidden="true">i</div>
        <p className="intro-title">&lt;i&gt;schedule</p>
        <p className="intro-subtitle">{isPersonal ? "ตารางสอบส่วนตัว" : "ตารางสอบ KMITL"}</p>
        <div className="intro-progress" aria-hidden="true"><span /></div>
      </div>
    </div>
  );
}
