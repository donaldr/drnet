"use client";
import { WorkData } from "@/app/@work/workitems";
import { useEffect, useRef, useState } from "react";
import { useLocomotiveScroll } from "react-locomotive-scroll";
import Image from "next/image";

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
      scroll.on("scroll", (obj: any) => {
        const showKey = `work-${index}-hero-show-target`;
        if (showKey in obj.currentElements) {
          const diff = obj.scroll.y - obj.currentElements[showKey].top;
          const o = diff / (window.innerHeight * 1.5);
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
          className={`h-screen w-screen absolute top-0 ${!show && "hidden"}`}
        >
          <video
            ref={videoRef}
            className="object-cover w-full h-full"
            src={work.hero}
            muted
            loop
            preload="auto"
          />
        </div>
      ) : (
        <div className="h-screen w-screen absolute top-0">
          <Image
            className="object-cover w-full h-full"
            alt="_"
            width={0}
            height={0}
            sizes="100vw"
            src={work.hero!}
          />
        </div>
      )}
    </>
  );
}
