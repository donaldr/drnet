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
              window.innerHeight * 0.5) /
              window.innerHeight
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
      className={`absolute top-[100vh] h-screen w-screen z-40 flex items-center justify-center ${
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
          style={{
            opacity: 1 - offset * 2,
          }}
        />
      )}
    </div>
  );
}
