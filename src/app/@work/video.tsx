"use client";
import { WorkData } from "@/app/@work/workitems";
import { RefObject, useEffect, useState } from "react";
import { useLocomotiveScroll } from "react-locomotive-scroll";

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

  useEffect(() => {
    if (scroll) {
      scroll.on("scroll", (obj: any) => {
        const key = `work-${index}-video-target`;
        if (key in obj.currentElements) {
          setOffset(
            (obj.scroll.y -
              obj.currentElements[key].top -
              document.documentElement.clientHeight * 0.5) /
              document.documentElement.clientHeight
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
  }, [scroll, index, videoRef]);

  useEffect(() => {
    if (offset >= 0.5) {
      setIsPast(true);
    } else {
      setIsPast(false);
    }
  }, [offset]);

  return (
    <div
      className={`absolute top-[100dvh] h-screen w-screen z-40 flex items-center justify-center ${
        isPast ? "" : "bg-[var(--dark)]"
      }`}
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
          crossOrigin="anonymous"
          style={{
            opacity: 1 - offset * 2,
          }}
        />
      )}
    </div>
  );
}
