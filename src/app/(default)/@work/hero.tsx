"use client";
import type { WorkData } from "@/app/(default)/@work/types";
import { useEffect, useRef } from "react";
import { useLocomotiveScroll } from "@/lib/locomotive";
import Image from "next/image";
import { incrementEventHandlerCount } from "@/lib/state";
import { markHandlerStart, markHandlerEnd } from "@/lib/scrollperf";
import { attachHls, type HlsHandle } from "@/lib/attachhls";

export default function Hero({
  index,
  work,
}: Readonly<{
  index: number;
  work: WorkData;
}>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const showRef = useRef(false);
  // Warm the hero video buffer on approach (it ships with preload="metadata").
  const preloadStartedRef = useRef(false);
  const hlsRef = useRef<HlsHandle | null>(null);
  const { scroll } = useLocomotiveScroll();

  // Tear down hls.js (if attached) on unmount.
  useEffect(() => () => hlsRef.current?.destroy(), []);

  useEffect(() => {
    if (scroll) {
      incrementEventHandlerCount("scroll-hero");
      scroll.on("scroll", (obj: any) => {
        markHandlerStart(`hero-${index}`);
        const showKey = `work-${index}-hero-show-target`;
        if (showKey in obj.currentElements) {
          if (
            !preloadStartedRef.current &&
            videoRef.current &&
            work.heroType == "video"
          ) {
            preloadStartedRef.current = true;
            if (work.heroHls) {
              attachHls(videoRef.current, work.heroHls).then((h) => {
                hlsRef.current = h;
              });
            } else {
              videoRef.current.preload = "auto";
              videoRef.current.load();
            }
          }
          const diff = obj.scroll.y - obj.currentElements[showKey].top;
          const o = diff / (document.documentElement.clientHeight * 1.5);
          const newShow = o >= -0.5 && o <= 1;
          if (newShow !== showRef.current) {
            showRef.current = newShow;
            // Direct DOM for visibility + video play/pause (no re-render)
            if (videoContainerRef.current) {
              videoContainerRef.current.classList.toggle("invisible", !newShow);
            }
            if (videoRef.current) {
              if (newShow) {
                videoRef.current.play();
              } else {
                videoRef.current.pause();
              }
            }
          }
        }
        markHandlerEnd(`hero-${index}`);
      });
    }
  }, [scroll, index]);

  return (
    <>
      {work.heroType == "video" ? (
        <div
          ref={videoContainerRef}
          className="h-[100dvh] w-screen absolute top-0 invisible"
        >
          <video
            ref={videoRef}
            className="object-cover w-full h-full"
            src={work.hero}
            muted
            loop
            preload="metadata"
            poster={work.heroPoster ?? work.thumb}
            style={
              work.thumbBlurDataURL
                ? {
                    backgroundImage: `url(${work.thumbBlurDataURL})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
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
