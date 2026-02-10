"use client";
import type { WorkData } from "@/app/(default)/@work/types";
import { useEffect, useRef, useState } from "react";
import { useLocomotiveScroll } from "@/lib/locomotive";
import Image from "next/image";
import { incrementEventHandlerCount } from "@/lib/state";

export default function Hero({
  index,
  work,
}: Readonly<{
  index: number;
  work: WorkData;
}>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scroll } = useLocomotiveScroll();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (scroll) {
      incrementEventHandlerCount("scroll-hero");
      scroll.on("scroll", (obj: any) => {
        const showKey = `work-${index}-hero-show-target`;
        if (showKey in obj.currentElements) {
          const diff = obj.scroll.y - obj.currentElements[showKey].top;
          const o = diff / (document.documentElement.clientHeight * 1.5);
          setShow(o >= -0.5 && o <= 1);
        }
      });
    }
  }, [scroll, index]);

  useEffect(() => {
    if (videoRef.current) {
      if (show) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [show]);

  return (
    <>
      {work.heroType == "video" ? (
        <div
          className={`h-[100dvh] w-screen absolute top-0 ${!show && "hidden"}`}
        >
          <video
            ref={videoRef}
            className="object-cover w-full h-full"
            src={work.hero}
            muted
            loop
            preload="metadata"
            poster={work.thumb}
          />
        </div>
      ) : (
        <div className="h-[100dvh] w-screen absolute top-0">
          <Image
            className="object-cover"
            alt={work.project}
            fill
            sizes="100dvw"
            loading="lazy"
            src={work.hero!}
            priority={false}
            {...(work.heroBlurDataURL && {
              placeholder: "blur",
              blurDataURL: work.heroBlurDataURL,
            })}
          />
        </div>
      )}
    </>
  );
}
