"use client";

import { useEffect, useRef, useState } from "react";
import { useGlobalState } from "@/lib/state";

export default function Loading() {
  const [loadProgress] = useGlobalState("loadProgress");
  const [doneLoading] = useGlobalState("doneLoading");
  const [removed, setRemoved] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const bar0Ref = useRef<SVGPathElement>(null);
  const bar1Ref = useRef<SVGPathElement>(null);
  const bar2Ref = useRef<SVGPathElement>(null);
  const bar3Ref = useRef<SVGPathElement>(null);
  const displayRef = useRef(0);
  const targetRef = useRef(0);
  const doneRef = useRef(false);

  // Sync React state into refs (no re-render needed by animation loop)
  targetRef.current = loadProgress;
  doneRef.current = doneLoading;

  useEffect(() => {
    const bars = [bar0Ref, bar1Ref, bar2Ref, bar3Ref];
    let running = true;

    const animate = () => {
      if (!running) return;

      const target = targetRef.current;
      if (displayRef.current < target) {
        displayRef.current = Math.min(target, displayRef.current + 1.5);
      }

      const progress = displayRef.current;
      const rounded = Math.round(progress);

      // Update percentage text directly
      if (textRef.current) {
        textRef.current.textContent = `${rounded}%`;
      }

      // Update bar opacities directly
      for (let i = 0; i < 4; i++) {
        const el = bars[i].current;
        if (el) {
          const barStart = i * 25;
          const barEnd = (i + 1) * 25;
          let bp = 0;
          if (progress >= barEnd) bp = 1;
          else if (progress > barStart) bp = (progress - barStart) / 25;
          el.style.opacity = String(0.125 + bp * 0.375);
        }
      }

      // Fade out when both conditions met
      if (rounded >= 100 && doneRef.current) {
        if (containerRef.current) {
          containerRef.current.style.opacity = "0";
          containerRef.current.style.pointerEvents = "none";
          // Remove from DOM after CSS transition completes
          setTimeout(() => setRemoved(true), 1100);
        }
        return;
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    return () => {
      running = false;
    };
  }, []);

  if (removed) return null;

  return (
    <div
      ref={containerRef}
      id="loading"
      className="absolute w-[100dvw] h-[100dvh] bg-[var(--dark)] light-grain top-0 left-0 flex flex-col items-center justify-center z-[9999] transition-opacity duration-1000"
    >
      <div className="h-[4em] py-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          id="Layer_1"
          viewBox="0 0 100 100"
          className="auto h-[2em] object-left transition-[fill] will-change-[fill] duration-1000"
        >
          <defs>
            <style>
              {".bg,.fg{fill:var(--foreground)}.bg{opacity:.125}"}
            </style>
          </defs>
          <path
            d="M0 0h18.14v100H0z"
            className="bg transition-[fill] will-change-[fill] duration-1000"
          />
          <path
            d="M54.57 0h18.14v100H54.57z"
            className="bg transition-[fill] will-change-[fill] duration-1000"
          />
          <path
            d="M81.86 0H100v100H81.86z"
            className="bg transition-[fill] will-change-[fill] duration-1000"
          />
          <path
            ref={bar0Ref}
            d="M0 45.81h18.14V100H0z"
            style={{ fill: "var(--foreground)", opacity: 0.125 }}
          />
          <path
            ref={bar1Ref}
            d="M27.29 0h18.14v100H27.29z"
            style={{ fill: "var(--foreground)", opacity: 0.125 }}
          />
          <path
            ref={bar2Ref}
            d="M54.57 30.3h18.14V100H54.57z"
            style={{ fill: "var(--foreground)", opacity: 0.125 }}
          />
          <path
            ref={bar3Ref}
            d="M81.86 30.3H100v25H81.86z"
            style={{ fill: "var(--foreground)", opacity: 0.125 }}
          />
        </svg>
      </div>
      <div
        ref={textRef}
        className="text-sm tracking-[0.2em]"
        style={{
          fontVariationSettings: '"slnt" 0, "wdth" 100, "wght" 200',
          color: "var(--foreground)",
          opacity: 0.5,
        }}
      >
        0%
      </div>
    </div>
  );
}
