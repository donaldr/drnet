"use client";
import { useEffect, useRef, useState } from "react";
import { WorkData } from "./workitems";
import clsx from "clsx";
import { incrementEventHandlerCount, useGlobalState } from "@/lib/state";
import { useLocomotiveScroll } from "@/lib/locomotive";
import { useThrottle } from "@/lib/customhooks";

export default function WorkNavigationItem({
  work,
  index,
}: Readonly<{
  work: WorkData;
  index: number;
}>) {
  const [hover, setHover] = useState(false);
  const [showText, setShowText] = useState(false);
  const showTextRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { scroll } = useLocomotiveScroll();

  const [activeName] = useGlobalState("active");
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const throttle = useThrottle();

  useEffect(() => {
    setActive(activeName == `work-${index}`);
  }, [activeName, work, index]);

  useEffect(() => {
    if (scroll) {
      incrementEventHandlerCount("scroll-worknavitem");
      scroll.on("scroll", (obj: any) => {
        if (`work-${index}-content` in obj.currentElements) {
          throttle(
            () =>
              setProgress(
                obj.currentElements[`work-${index}-content`].progress
              ),
            10
          );
        }
      });
    }
  }, [scroll, index, setProgress, throttle]);

  return (
    <a
      href={`/work/${work.slug}`}
      onClick={(e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        window.history.pushState(null, "", `/work/${work.slug}`);
      }}
    >
      <div
        id={`work-navigation-work-${index}`}
        key={work.project}
        className="relative w-auto flex flex-col items-end justify-start group drop-shadow-workNavigation"
        onMouseEnter={() => {
          setHover(true);
          if (showTextRef.current) clearTimeout(showTextRef.current);
          showTextRef.current = setTimeout(() => {
            setShowText(true);
          }, 500);
        }}
        onMouseLeave={() => {
          setHover(false);
          if (showTextRef.current) clearTimeout(showTextRef.current);
          setShowText(false);
        }}
      >
        <div
          className={`absolute top-[-0.1rem] right-[-0.1rem] h-[3.2rem] w-screen group-hover:max-w-full max-w-[3.2rem] overflow-hidden z-50 duration-250 transition-[opacity,width,max-width] ${clsx(
            {
              "opacity-100": active && !hover,
              "opacity-0": !active || hover,
            }
          )}`}
          style={{
            height: `${progress * 3.2}rem`,
          }}
        >
          <div
            className={`w-full h-[3.2rem] rounded-full border-[0.4rem] z-50`}
            style={{
              borderColor: work.primaryColor,
            }}
          >
            <div className="px-[1rem] opacity-0 font-bold">{work.project}</div>
          </div>
        </div>
        <div
          id={`work-navigation-work-${index}-main-icon`}
          className={`rounded-full flex items-center justify-center group-hover:max-w-full duration-250 transition-all z-30 mb-[0.5rem] relative cursor-pointer ${clsx(
            {
              "max-w-[3rem]": active,
              "h-[3rem]": active,
              "max-w-[2.5rem]": !active,
              "h-[2.5rem]": !active,
              "mr-[0.25rem]": !active,
            }
          )}`}
          style={{
            clipPath: "content-box",
          }}
        >
          <div
            className={`absolute top-0 w-full h-full rounded-full border-[0.25rem] z-50 border-white`}
          ></div>
          <div className="relative opacity-100 group-hover:opacity-100 group-hover:brightness-50 group-hover:blur-sm delay-500 duration-500 w-full px-[0.25rem] h-[4rem] z-20">
            <div
              id={`work-navigation-work-${index}-main-icon-image`}
              className="relative w-auto rounded-full transition-all whitespace-nowrap leading-[4rem] box-content overflow-hidden delay-0 duration-0 z-20"
              style={{
                backgroundImage: `url(${work.thumb})`,
                backgroundPosition: `${
                  hover
                    ? -work.thumbEndFocus.x * work.thumbEndScale
                    : -work.thumbStartFocus.x * work.thumbStartScale
                }px ${
                  hover
                    ? -work.thumbEndFocus.y * work.thumbEndScale
                    : -work.thumbStartFocus.y * work.thumbStartScale
                }px`,
                backgroundSize: `${
                  work.thumbSize.width *
                  (hover ? work.thumbEndScale : work.thumbStartScale)
                }px ${
                  work.thumbSize.height *
                  (hover ? work.thumbEndScale : work.thumbStartScale)
                }px`,
              }}
            >
              <div className="px-[1rem] opacity-0 font-bold">
                {work.project}
              </div>
            </div>
          </div>
          <div className="absolute w-full px-[0.25rem]">
            <div
              className="rounded-full top-0 z-10 h-[2rem] box-border w-full"
              style={{
                backgroundImage: `url(${work.thumb})`,
                backgroundPosition: `${
                  hover
                    ? -work.thumbEndFocus.x * work.thumbEndScale
                    : -work.thumbStartFocus.x * work.thumbStartScale
                }px ${
                  hover
                    ? -work.thumbEndFocus.y * work.thumbEndScale
                    : -work.thumbStartFocus.y * work.thumbStartScale
                }px`,
                backgroundSize: `${
                  work.thumbSize.width *
                  (hover ? work.thumbEndScale : work.thumbStartScale)
                }px ${
                  work.thumbSize.height *
                  (hover ? work.thumbEndScale : work.thumbStartScale)
                }px`,
              }}
            ></div>
          </div>
          <div
            className={`px-[0.5rem] font-bold absolute top-0 opacity-0 transition-[opacity] text-[var(--light)] h-full z-50 overflow-hidden ${clsx(
              {
                "opacity-100": showText,
                "leading-[2.5rem]": !active,
                "leading-[3rem]": active,
              }
            )}`}
          >
            {work.project}
          </div>
        </div>
      </div>
    </a>
  );
}
