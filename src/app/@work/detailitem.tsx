"use client";
import { memo } from "react";
/*
import { useEffect, useMemo, useRef, useState, memo } from "react";
import { useLocomotiveScroll } from "react-locomotive-scroll";
import { useLineText } from "@/lib/linetext";
import SVGStroke from "@/lib/svgstroke";
import clsx from "clsx";
*/
import { SplitText } from "@rigo-m/react-split-text";
import clsx from "clsx";

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
  return (
    <>
      {
        //@ts-expect-error SplitText says it doesn't take children but it does
        <SplitText
          className="inline whitespace-pre"
          //@ts-expect-error LineWrapper says it doesn't have children parameter but it does
          LineWrapper={({ children, lineIndex }) => {
            return (
              <div className="inline-block">
                <div
                  className={`${clsx({
                    "flex flex-col items-center justify-center": lineIndex == 0,
                  })}`}
                >
                  <div className="relative overflow-hidden">
                    <div
                      ref={(instance: unknown) => {
                        if (instance) {
                          const el = instance as HTMLElement;
                          const ancestorEl = (instance as HTMLElement)
                            .parentElement?.parentElement
                            ?.parentElement as HTMLElement;
                          const ancestorParent =
                            ancestorEl.offsetParent! as HTMLElement;
                          el.style.transitionDelay = `${(
                            1000 *
                            (ancestorEl.offsetTop / ancestorParent.offsetHeight)
                          ).toFixed(2)}ms`;
                        }
                      }}
                      className={`absolute underline underline-offset-8 text-[rgba(0,0,0,0)] transition-[left] left-[-101%] ${groupUnderlineRevealClass} duration-1000`}
                      style={{
                        textDecorationColor: color,
                      }}
                    >
                      {children}
                    </div>
                    <div className="absolute inline-block h-[90%] overflow-hidden">
                      <div
                        ref={(instance: unknown) => {
                          if (instance) {
                            const el = instance as HTMLElement;
                            const ancestorEl = (instance as HTMLElement)
                              .parentElement?.parentElement
                              ?.parentElement as HTMLElement;
                            const ancestorParent =
                              ancestorEl.offsetParent! as HTMLElement;
                            el.style.transitionDelay = `${(
                              1000 *
                              (ancestorEl.offsetTop /
                                ancestorParent.offsetHeight)
                            ).toFixed(2)}ms`;
                          }
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
