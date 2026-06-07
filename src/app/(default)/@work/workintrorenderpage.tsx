"use client";

import { useLineText } from "@/lib/linetext";
import { useCallback, useEffect, useRef, useState } from "react";
import SVGStroke from "@/lib/svgstroke";
import { useLocomotiveScroll } from "@/lib/locomotive";
import {
  decrementEventHandlerCount,
  incrementEventHandlerCount,
  useGlobalState,
} from "@/lib/state";
import clsx from "clsx";
import { useDebounce } from "@/lib/customhooks";
import { markHandlerStart, markHandlerEnd } from "@/lib/scrollperf";

export default function WorkIntroComponent() {
  const pathRefs = useRef<Array<SVGPathElement | null>>([]);
  const lineRefs = useRef<Array<SVGPathElement | null>>([]);
  const [refsAllSet, setRefsAllSet] = useState(false);
  const [size, setSize] = useState<[number, number] | undefined>();

  const svgRef = useRef<SVGSVGElement>(null);
  const prevNormalizedRef = useRef(-1);
  const pathLengthsRef = useRef<number[]>([]);
  const lineLengthsRef = useRef<number[]>([]);
  const [textContainerClasses, setTextContainerClasses] = useState("opacity-0");

  const workIntroText = useLineText(
    "SELECTED WORK".toUpperCase().split("").join(" "),
    size ? size[0] / "SELECTED WORK".length : 72
  );

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
    incrementEventHandlerCount("resize-workintrorender");
    window.addEventListener("resize", resize);
    return () => {
      decrementEventHandlerCount("resize-workintrorender");
      window.removeEventListener("resize", resize);
    };
  }, [resize]);

  const checkAllRefs = useCallback(() => {
    const allSet =
      !!workIntroText &&
      !!workIntroText.paths &&
      pathRefs.current.length == workIntroText.paths.length &&
      pathRefs.current.every((el) => el) &&
      lineRefs.current.length == 2 &&
      lineRefs.current.every((el) => el);

    if (allSet) {
      // Pre-compute path lengths so the scroll handler never calls getTotalLength()
      for (let i = 0; i < pathRefs.current.length; i++) {
        const path = pathRefs.current[i];
        if (path && !pathLengthsRef.current[i]) {
          pathLengthsRef.current[i] = path.getTotalLength();
        }
      }
      for (let i = 0; i < lineRefs.current.length; i++) {
        const path = lineRefs.current[i];
        if (path && !lineLengthsRef.current[i]) {
          lineLengthsRef.current[i] = path.getTotalLength();
        }
      }
    }

    setRefsAllSet(allSet);
  }, [workIntroText, pathRefs, lineRefs]);

  const { scroll } = useLocomotiveScroll();

  const [activeList] = useGlobalState("activeList");
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(activeList[activeList.length - 1] == "work-intro");
  }, [activeList]);

  useEffect(() => {
    setTextContainerClasses(
      clsx({
        "h-[100dvh] w-screen transition-[opacity] duration-1000 will-change-[opacity,transform] bg-[var(--dark)] absolute top-[-200dvh] flex items-center justify-center pointer-events-none":
          true,
        "opacity-100": active && refsAllSet,
        "opacity-0": !(active && refsAllSet),
        "light-grain": true,
      })
    );
  }, [active, refsAllSet]);

  useEffect(() => {
    if (scroll) {
      incrementEventHandlerCount("scroll-workintrorender");
      scroll.on("scroll", (obj: any) => {
        markHandlerStart("workintro");
        const key = `work-intro-container`;
        if (key in obj.currentElements) {
          const diff = obj.scroll.y - obj.currentElements[key].top;
          const normalized =
            (diff * 2 - 1) / document.documentElement.clientHeight;
          const offset = Math.max(0, Math.min(1, normalized));

          // Direct DOM for smooth transform (every frame)
          if (svgRef.current) {
            svgRef.current.style.transform = `translateY(${-50 * offset}dvh)`;
          }

          // Direct DOM for stroke dasharray (quantized, skip when unchanged)
          const quantized = Math.round(normalized * 200);
          if (quantized !== Math.round(prevNormalizedRef.current * 200)) {
            prevNormalizedRef.current = normalized;
            const sl = Math.max(0, Math.min(1, 1 - normalized));

            for (let i = 0; i < pathRefs.current.length; i++) {
              const path = pathRefs.current[i];
              const len = pathLengthsRef.current[i];
              if (!path || !len) continue;
              if (sl === 0) {
                path.style.visibility = "hidden";
              } else {
                path.style.visibility = "";
                path.style.strokeDasharray = `${len * sl} ${len * (1 - sl)}`;
              }
            }
            for (let i = 0; i < lineRefs.current.length; i++) {
              const path = lineRefs.current[i];
              const len = lineLengthsRef.current[i];
              if (!path || !len) continue;
              if (sl === 0) {
                path.style.visibility = "hidden";
              } else {
                path.style.visibility = "";
                path.style.strokeDasharray = `${len * sl} ${len * (1 - sl)}`;
              }
            }
          }
        }
        markHandlerEnd("workintro");
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
          ref={svgRef}
          xmlns="http://www.w3.org/2000/svg"
          xmlSpace="preserve"
          width={workIntroText.width}
          height={
            workIntroText.height ? Math.floor(workIntroText.height * 1.2) : 0
          }
          className="mb-1"
          style={{
            transform: "translateY(0dvh)",
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
                strokeLength={1}
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
                strokeLength={1}
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
                strokeLength={1}
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
