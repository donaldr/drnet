"use client";
import { WorkData } from "@/app/(default)/@work/workitems";
import { RefObject, useEffect, useState } from "react";
import { useLocomotiveScroll } from "@/lib/locomotive";
import { useThrottle } from "@/lib/customhooks";
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
  const [offset, setOffset] = useState(0);
  const { scroll } = useLocomotiveScroll();
  const [isPast, setIsPast] = useState(false);
  const throttle = useThrottle();

  useEffect(() => {
    if (scroll) {
      incrementEventHandlerCount("scroll-video");
      scroll.on("scroll", (obj: any) => {
        const key = `work-${index}-video-target`;
        if (key in obj.currentElements) {
          throttle(
            () =>
              setOffset(
                (obj.scroll.y -
                  obj.currentElements[key].top -
                  document.documentElement.clientHeight * 0.5) /
                  document.documentElement.clientHeight
              ),
            10
          );
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
  }, [scroll, index, videoRef, throttle]);

  useEffect(() => {
    if (offset >= 0.5) {
      setIsPast(true);
    } else {
      setIsPast(false);
    }
  }, [offset]);

  return (
    <div
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
          style={{
            opacity: 1 - offset * 2,
          }}
        />
      )}
    </div>
  );
}
