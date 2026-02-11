"use client";
import type { WorkData } from "@/app/(default)/@work/types";
import { RefObject, useEffect, useRef, useState } from "react";
import { useLocomotiveScroll } from "@/lib/locomotive";
import clsx from "clsx";
import { incrementEventHandlerCount } from "@/lib/state";

export default function Video({
  index,
  work,
  videoRef,
}: Readonly<{
  index: number;
  work: WorkData;
  videoRef: RefObject<HTMLVideoElement | null>;
}>) {
  const { scroll } = useLocomotiveScroll();
  const [isPast, setIsPast] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPastRef = useRef(false);

  useEffect(() => {
    if (scroll) {
      incrementEventHandlerCount("scroll-video");
      scroll.on("scroll", (obj: any) => {
        const key = `work-${index}-video-target`;
        if (key in obj.currentElements) {
          const offset =
            (obj.scroll.y -
              obj.currentElements[key].top -
              document.documentElement.clientHeight * 0.5) /
            document.documentElement.clientHeight;

          // Update video opacity directly via DOM (no re-render)
          if (videoRef.current) {
            videoRef.current.style.opacity = String(1 - offset * 2);
          }

          // Only trigger re-render when isPast actually changes
          const nowPast = offset >= 0.5;
          if (nowPast !== isPastRef.current) {
            isPastRef.current = nowPast;
            setIsPast(nowPast);
          }
        }
      });
      scroll.on("call", (f: string, type: string) => {
        if (f == `work${index}VideoElementInView` && videoRef.current) {
          if (type == "enter") {
            videoRef.current.play();
          } else {
            videoRef.current.pause();
          }
        }
      });
    }
  }, [scroll, index, videoRef]);

  return (
    <div
      ref={containerRef}
      className={`absolute top-[100dvh] h-[100dvh] w-screen z-40 flex items-center justify-center ${clsx(
        {
          "bg-[var(--dark)]": !isPast,
          "px-[10dvw]": work.needsPadding,
          "py-[10dvh]": work.needsPadding,
        }
      )}`}
    >
      {work.video && (
        <video
          ref={videoRef}
          className={`w-full`}
          src={work.video}
          controls
          width="100%"
          height="100%"
          muted
          preload="none"
          crossOrigin="anonymous"
          poster={work.thumb}
        />
      )}
    </div>
  );
}
