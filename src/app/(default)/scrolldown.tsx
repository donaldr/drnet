"use client";

import { useLineText } from "@/lib/linetext";
import {
  decrementEventHandlerCount,
  incrementEventHandlerCount,
  useGlobalState,
} from "@/lib/state";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import SVGStroke from "@/lib/svgstroke";

type Timeout = ReturnType<typeof setTimeout>;

enum ShowState {
  SHOWING = "showing",
  SHOWN = "shown",
  HIDING = "hiding",
  HIDDEN = "hidden",
}

export default function ScrollDown() {
  const [scrollDownClasses, setScrollDownClasses] = useState("");
  const [navigating] = useGlobalState("navigating");
  const [showState, setShowState] = useState(ShowState.HIDDEN);
  const [hidden, setHidden] = useState(true);
  const showStateRef = useRef(showState);

  const [activeName] = useGlobalState("active");
  const activeNameRef = useRef("");
  const showRef = useRef<Timeout | null>(null);
  const unshowRef = useRef<Timeout | null>(null);
  const [refsAllSet, setRefsAllSet] = useState(false);
  const arrowRefs = useRef<Array<SVGPathElement | null>>([]);
  const pathRefs = useRef<Array<SVGPathElement | null>>([]);
  const requestRef = useRef<number>(0);
  const [offset, setOffset] = useState(0);

  const scrollDownText = useLineText(
    "SCROLL DOWN".toUpperCase().split("").join(" "),
    12
  );

  const checkAllRefs = useCallback(() => {
    setRefsAllSet(
      !!scrollDownText.paths &&
        pathRefs.current.length == scrollDownText.paths.length &&
        pathRefs.current.every((el) => el) &&
        arrowRefs.current.length == 3 &&
        arrowRefs.current.every((el) => el)
    );
  }, [scrollDownText, pathRefs, arrowRefs]);

  const wheel = useCallback(() => {
    if (showRef.current) {
      clearTimeout(showRef.current);
      showRef.current = null;
    }
    if (unshowRef.current) {
      clearTimeout(unshowRef.current);
      unshowRef.current = null;
    }
    if ([ShowState.SHOWING, ShowState.SHOWN].includes(showStateRef.current)) {
      setShowState(ShowState.HIDING);
    }
  }, []);

  useEffect(() => {
    activeNameRef.current = activeName;
  }, [activeName]);

  useEffect(() => {
    incrementEventHandlerCount("wheel");
    incrementEventHandlerCount("touchmove");
    window.addEventListener("wheel", wheel);
    window.addEventListener("touchmove", wheel);
    return () => {
      decrementEventHandlerCount("wheel");
      decrementEventHandlerCount("touchmove");
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("touchmove", wheel);
    };
  }, [wheel]);

  useEffect(() => {
    setShowState(ShowState.HIDING);
    if (showRef.current) {
      clearTimeout(showRef.current);
      showRef.current = null;
    }
    if (unshowRef.current) {
      clearTimeout(unshowRef.current);
      unshowRef.current = null;
    }
    if (activeNameRef.current != "contact") {
      setShowState(ShowState.HIDING);
      if (showRef.current) {
        clearTimeout(showRef.current);
        showRef.current = null;
      }
      if (unshowRef.current) {
        clearTimeout(unshowRef.current);
        unshowRef.current = null;
      }
      showRef.current = setTimeout(() => {
        setShowState(ShowState.SHOWING);
        unshowRef.current = setTimeout(() => {
          setShowState(ShowState.HIDING);
        }, 5000);
      }, 1000);
    }
  }, [navigating]);

  useEffect(() => {
    if (offset == 0) {
      setShowState(ShowState.HIDDEN);
    } else if (offset == 1) {
      setShowState(ShowState.SHOWN);
    }
  }, [offset]);

  useEffect(() => {
    setHidden(showState == ShowState.HIDDEN);
    showStateRef.current = showState;
  }, [showState]);

  const animate = useCallback(() => {
    if (showStateRef.current == ShowState.SHOWING) {
      setOffset((prev) => Math.ceil((prev * 0.95 + 0.05) * 1000) / 1000);
    } else if (showStateRef.current == ShowState.HIDING) {
      setOffset((prev) => {
        if (prev == 0) {
          setShowState(ShowState.HIDDEN);
        }
        return Math.floor((prev * 0.9 + 0) * 1000) / 1000;
      });
    }

    if (
      showStateRef.current == ShowState.SHOWING ||
      showStateRef.current == ShowState.SHOWN ||
      showStateRef.current == ShowState.HIDING
    ) {
      requestRef.current = requestAnimationFrame(animate);
    }
  }, []);

  useEffect(() => {
    if (!hidden) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [hidden, animate]);

  useEffect(() => {
    setScrollDownClasses(
      clsx({
        "absolute top-0 left-0 w-[100dvw] h-[100dvh] flex flex-col items-center justify-end pointer-events-none z-[200] transition-[opacity] will-change-opacity duration-1000":
          true,
        "opacity-100": !hidden && refsAllSet,
        "opacity-0": !(!hidden && refsAllSet),
      })
    );
  }, [hidden, refsAllSet]);

  return (
    <div className={scrollDownClasses}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlSpace="preserve"
        width={128}
        height={128}
        viewBox="0 0 128 128"
        className="h-16 md:h-32"
      >
        <line
          ref={(el) => {
            arrowRefs.current[0] = el;
            checkAllRefs();
          }}
          pathLength={1}
          strokeWidth={2}
          style={{
            fill: "none",
            stroke: "#FFFFFF",
            strokeDashoffset: `${-Math.max(0, offset)}`,
            strokeDasharray: `${Math.max(0, offset)} ${1 - offset}`,
          }}
          x1="64"
          y1="3.51"
          x2="64"
          y2="121.72"
        />
        <line
          ref={(el) => {
            arrowRefs.current[1] = el;
            checkAllRefs();
          }}
          strokeWidth={2}
          pathLength={1}
          style={{
            fill: "none",
            stroke: "#FFFFFF",
            strokeDashoffset: `${-Math.max(0, offset)}`,
            strokeDasharray: `${Math.max(0, offset)} ${1 - offset}`,
          }}
          x1="64"
          y1="121.72"
          x2="101.47"
          y2="84.25"
        />
        <line
          ref={(el) => {
            arrowRefs.current[2] = el;
            checkAllRefs();
          }}
          strokeWidth={2}
          pathLength={1}
          style={{
            fill: "none",
            stroke: "#FFFFFF",
            strokeDashoffset: `${-Math.max(0, offset)}`,
            strokeDasharray: `${Math.max(0, offset)} ${1 - offset}`,
          }}
          x1="64"
          y1="121.72"
          x2="26.53"
          y2="84.25"
        />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlSpace="preserve"
        width={scrollDownText.width}
        height={scrollDownText.height ? scrollDownText.height + 5 : 0}
        className="mb-16"
      >
        {scrollDownText &&
          scrollDownText.paths &&
          scrollDownText.paths.map((path: string, index: number) => (
            <SVGStroke
              key={`path${index}`}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={1}
              startStroke={0}
              strokeLength={Math.max(
                0,
                Math.min(
                  1,
                  offset * (scrollDownText.paths!.length / 4) -
                    index / scrollDownText.paths!.length
                )
              )}
              strokeLinecap="round"
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
      </svg>
    </div>
  );
}
