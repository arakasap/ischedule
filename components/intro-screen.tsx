"use client";

import { useEffect, useLayoutEffect, useState } from "react";

type IntroState = "visible" | "leaving" | "hidden";

export function IntroScreen() {
  const [state, setState] = useState<IntroState>("visible");

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

    const leaveTimer = window.setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.dataset.countdownStage = "spotlight";
      setState("leaving");
    }, leaveAfter);
    const removeTimer = window.setTimeout(() => {
      document.documentElement.dataset.introDone = "true";
      window.dispatchEvent(new Event("intro-complete"));
      setState("hidden");
    }, removeAfter);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (state === "hidden") return null;

  return (
    <div
      className={`intro-screen intro-screen-${state}`}
      role="status"
      aria-live="polite"
      aria-label="กำลังเปิด <i>schedule"
    >
      <div className="intro-glow intro-glow-one" />
      <div className="intro-glow intro-glow-two" />
      <div className="intro-content">
        <div className="intro-mark" aria-hidden="true">i</div>
        <p className="intro-title">&lt;i&gt;schedule</p>
        <p className="intro-subtitle">ตารางสอบ KMITL</p>
        <div className="intro-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
