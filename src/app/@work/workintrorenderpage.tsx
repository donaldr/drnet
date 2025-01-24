"use client";

import { useLineText } from "@/lib/linetext";
import { useCallback, useEffect, useRef, useState } from "react";
import SVGStroke from "@/lib/svgstroke";
import { useLocomotiveScroll } from "react-locomotive-scroll";
import { useGlobalState } from "@/lib/state";
import clsx from "clsx";

export default function WorkIntroComponent() {
  const pathRefs = useRef<Array<SVGPathElement | null>>([]);
  const lineRefs = useRef<Array<SVGPathElement | null>>([]);
  const [refsAllSet, setRefsAllSet] = useState(false);
  const [size, setSize] = useState<[number, number] | undefined>();

  const [length, setLength] = useState(1);
  const [textContainerClasses, setTextContainerClasses] = useState("opacity-0");

  const workIntroText = useLineText(
    "SELECTED WORK".toUpperCase().split("").join(" "),
    size ? size[0] / "SELECTED WORK".length : 72
  );

  const resize = useCallback(() => {
    setSize([
      document.documentElement.clientWidth,
      document.documentElement.clientHeight,
    ]);
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  const checkAllRefs = useCallback(() => {
    setRefsAllSet(
      !!workIntroText &&
        !!workIntroText.paths &&
        pathRefs.current.length == workIntroText.paths.length &&
        pathRefs.current.every((el) => el) &&
        lineRefs.current.length == 2 &&
        lineRefs.current.every((el) => el)
    );
  }, [workIntroText, pathRefs, lineRefs]);

  const [offset, setOffset] = useState(0);
  const { scroll } = useLocomotiveScroll();

  const [activeList] = useGlobalState("activeList");
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(activeList[activeList.length - 1] == "work-intro");
  }, [activeList]);

  useEffect(() => {
    setTextContainerClasses(
      clsx({
        "h-screen w-screen transition-[opacity] duration-1000 will-change-[opacity,transform] bg-[var(--dark)] absolute top-[-200vh] flex items-center justify-center pointer-events-none":
          true,
        "opacity-100": active && refsAllSet,
        "opacity-0": !(active && refsAllSet),
        "light-grain": true,
      })
    );
  }, [active, refsAllSet, length]);

  useEffect(() => {
    if (scroll) {
      scroll.on("scroll", (obj: any) => {
        const key = `work-intro-container`;
        if (key in obj.currentElements) {
          const diff = obj.scroll.y - obj.currentElements[key].top;
          setLength(
            Math.min(
              Math.max(
                0,
                1 - (diff * 2 - 1) / document.documentElement.clientHeight
              ),
              1
            )
          );
          setOffset(
            Math.min(
              Math.max(
                0,
                (diff * 2 - 1) / document.documentElement.clientHeight
              ),
              1
            )
          );
        }
      });
    }
  }, [scroll]);

  return (
    <div
      className={textContainerClasses}
      data-scroll="true"
      data-scroll-sticky="true"
      data-scroll-target="#full"
      data-scroll-id="work-intro-container"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlSpace="preserve"
        width={workIntroText.width}
        height={
          workIntroText.height ? Math.floor(workIntroText.height * 1.2) : 0
        }
        className="mb-1"
        style={{
          transform: `translateY(${-50 * offset!}vh)`,
        }}
      >
        {workIntroText &&
          workIntroText.paths &&
          workIntroText.paths.map((path: string, index: number) => (
            <SVGStroke
              key={`path${index}`}
              fill="none"
              stroke="#999999"
              strokeWidth={1}
              startStroke={0}
              strokeLength={length}
              svgPath={pathRefs.current[index]}
              renderSVGPath={(pathCSS: React.CSSProperties) => {
                return (
                  <path
                    ref={(el) => {
                      pathRefs.current[index] = el;
                      checkAllRefs();
                    }}
                    d={path}
                    style={pathCSS}
                  />
                );
              }}
            />
          ))}
        {workIntroText.width && workIntroText.height && (
          <>
            <SVGStroke
              fill="none"
              stroke="#999999"
              strokeWidth={1}
              startStroke={0}
              strokeLength={length}
              svgPath={lineRefs.current[0]}
              renderSVGPath={(pathCSS: React.CSSProperties) => {
                return (
                  <path
                    ref={(el) => {
                      lineRefs.current[0] = el;
                      checkAllRefs();
                    }}
                    d={
                      workIntroText.width
                        ? `M ${Math.floor(
                            workIntroText.width / 2
                          )} ${Math.floor(
                            workIntroText.height! * 1.1
                          )}L 0 ${Math.floor(workIntroText.height! * 1.1)}`
                        : ""
                    }
                    style={pathCSS}
                  />
                );
              }}
            />
            <SVGStroke
              fill="none"
              stroke="#999999"
              strokeWidth={1}
              startStroke={0}
              strokeLength={length}
              svgPath={lineRefs.current[1]}
              renderSVGPath={(pathCSS: React.CSSProperties) => {
                return (
                  <path
                    ref={(el) => {
                      lineRefs.current[1] = el;
                      checkAllRefs();
                    }}
                    d={
                      workIntroText.width
                        ? `M ${Math.floor(
                            workIntroText.width / 2
                          )} ${Math.floor(workIntroText.height! * 1.1)}L ${
                            workIntroText.width
                          } ${Math.floor(workIntroText.height! * 1.1)}`
                        : ""
                    }
                    style={pathCSS}
                  />
                );
              }}
            />
          </>
        )}
      </svg>
    </div>
  );
}
