"use client";
import { memo, useCallback, useEffect, useRef, useState } from "react";
/*
import { useEffect, useMemo, useRef, useState, memo } from "react";
import { useLocomotiveScroll } from "react-locomotive-scroll";
import { useLineText } from "@/lib/linetext";
import SVGStroke from "@/lib/svgstroke";
import clsx from "clsx";
*/
import { SplitText } from "@rigo-m/react-split-text";
import clsx from "clsx";
import { useDebounce } from "@/lib/customhooks";

function DetailItem({
  children,
  label,
  color,
  groupRevealClass,
  groupUnderlineRevealClass,
}: Readonly<{
  children?: React.ReactNode;
  label: string;
  color: string;
  groupRevealClass: string;
  groupUnderlineRevealClass: string;
}>) {
  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<[number, number] | undefined>();
  const debouncer = useDebounce();

  const resize = useCallback(() => {
    debouncer(() => {
      setSize([
        document.documentElement.clientWidth,
        document.documentElement.clientHeight,
      ]);
    });
  }, [debouncer]);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  const setDelay = useCallback((ref: HTMLDivElement) => {
    const ancestorEl = ref.parentElement?.parentElement
      ?.parentElement as HTMLElement;
    const ancestorParent = ancestorEl.offsetParent! as HTMLElement;
    if (ancestorParent) {
      ref.style.transitionDelay = `${(
        1000 *
        (ancestorEl.offsetTop / ancestorParent.offsetHeight)
      ).toFixed(2)}ms`;
    }
  }, []);

  useEffect(() => {
    if (ref1.current) setDelay(ref1.current);
    if (ref2.current) setDelay(ref2.current);
  }, [size, setDelay]);

  return (
    <>
      {
        //@ts-expect-error SplitText says it doesn't take children but it does
        <SplitText
          className="inline whitespace-pre"
          //@ts-expect-error LineWrapper says it doesn't have children parameter but it does
          LineWrapper={({ children, lineIndex }) => {
            return (
              <div className="inline-block leading-[1.5]">
                <div
                  className={`${clsx({
                    "flex flex-col items-center justify-center": lineIndex == 0,
                  })}`}
                >
                  <div className="relative overflow-hidden">
                    <div
                      ref={(instance: HTMLDivElement) => {
                        ref1.current = instance;
                      }}
                      className={`absolute underline underline-offset-12 text-[rgba(0,0,0,0)] transition-[left] left-[-101%] ${groupUnderlineRevealClass} duration-1000`}
                      style={{
                        textDecorationColor: color,
                      }}
                    >
                      {children}
                    </div>
                    <div className="absolute inline-block h-[90%] overflow-hidden">
                      <div
                        ref={(instance: HTMLDivElement) => {
                          ref2.current = instance;
                        }}
                        className={`absolute inline-block transition-[top] ${groupRevealClass} top-[100%] duration-1000`}
                      >
                        {children}
                      </div>
                      <span className="opacity-0">{children}</span>
                    </div>
                    <span className="opacity-0">{children}</span>
                  </div>
                  {lineIndex == 0 && (
                    <div className="label text-[0.5rem]">{label}</div>
                  )}
                </div>
              </div>
            );
          }}
        >
          {children}
        </SplitText>
      }
    </>
  );
}

export default memo(DetailItem);
