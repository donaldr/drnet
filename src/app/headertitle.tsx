"use client";
import React, { useEffect, useState } from "react";
import { useLocomotiveScroll } from "react-locomotive-scroll";
import Image from "next/image";

export default function HeaderTitle({
  children,
  color,
  id,
  showBackground = true,
  theme,
  setImageSrcCallbackRef,
}: Readonly<{
  children: React.ReactNode;
  id: string;
  color: string;
  showBackground?: boolean;
  theme: string;
  setImageSrcCallbackRef?: any;
}>) {
  const { scroll } = useLocomotiveScroll();
  const [show, setShow] = useState(false);
  const [titlePosition, setTitlePosition] = useState(0);
  const [imageSrc, setImageSrc] = useState<string>();

  useEffect(() => {
    if (setImageSrcCallbackRef) {
      setImageSrcCallbackRef.current = setImageSrc;
    }
  }, [setImageSrcCallbackRef]);

  useEffect(() => {
    if (scroll) {
      scroll.on("scroll", (scroll: any) => {
        const el: any = Object.values(scroll.currentElements).filter(
          (el: any) => el.el.id == `${id}-title-background-target`
        );
        if (el.length) {
          const position = Math.min(
            88,
            Math.max(
              0,
              el[0].progress *
                (el[0].el.offsetHeight +
                  document.documentElement.clientHeight) -
                document.documentElement.clientHeight
            )
          );
          setTitlePosition(position);
        }
      });
      scroll.on("call", (f: string, type: string) => {
        if (f == `showTitleBackground${id}`) {
          if (type == "enter") {
            setShow(true);
          } else {
            setShow(false);
          }
        }
      });
    }
  }, [scroll, id]);

  return (
    <>
      <div className="absolute top-0 h-full">
        <div
          id={`${id}-title-background-target`}
          className="absolute top-0 h-full"
          data-scroll
          data-scroll-repeat
        ></div>
        <div
          id={`${id}-title-appear`}
          className="absolute top-[100dvh] h-full"
          data-scroll
          data-scroll-repeat
          data-scroll-call={`showTitleBackground${id}`}
        ></div>
      </div>
      <div
        id={`${id}-title-background`}
        data-scroll
        data-scroll-sticky
        data-scroll-target={`#${id}-title-background-target`}
        data-scroll-repeat
        className="relative h-[3rem] w-full z-[46] flex pl-[calc(5dvw+4rem)] text-2xl overflow-hidden will-change-transform"
        style={{
          fontVariationSettings: `"wdth" 100, "wght" ${
            theme == "dark" ? 600 : 600
          }`,
          ...(showBackground && {
            backgroundColor: imageSrc ? "var(--dark)" : color,
          }),
          opacity: show ? 1 : 0,
        }}
      >
        <div
          className={`h-header w-full flex flex-col items-start justify-center`}
        >
          <div
            className="relative z-50 leading-tight hidden md:block"
            style={{
              marginTop: `${88 - titlePosition}px`,
            }}
          >
            {children}
          </div>
          {imageSrc && (
            <Image
              className={`absolute top-0 left-0 z-40 w-screen h-[100dvh] object-cover saturate-[0.2] brightness-[0.2] blur-sm will-change-opacity ${
                showBackground
                  ? "opacity-100"
                  : "transition-opacity duration-1000 transition-none opacity-0"
              }`}
              alt="boop"
              width={0}
              height={0}
              sizes="100dvw"
              src={imageSrc}
            />
          )}
        </div>
      </div>
    </>
  );
}
