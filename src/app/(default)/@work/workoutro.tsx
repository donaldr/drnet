"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useLocomotiveScroll } from "@/lib/locomotive";
import Path from "svg-path-generator";
import { Bezier as BezierAnalyzer } from "bezier-js";
import { useDebounce } from "@/lib/customhooks";
import {
  decrementEventHandlerCount,
  incrementEventHandlerCount,
} from "@/lib/state";
import { markHandlerStart, markHandlerEnd } from "@/lib/scrollperf";

type Point = {
  x: number;
  y: number;
};

type BezierCurve = {
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
};

type BezierSpline = Array<BezierCurve>;

function getSplineBounds(spline: BezierSpline) {
  const startPoint = { ...spline[0].p0 };
  const endPoint = { ...spline[spline.length - 1].p3 };
  let minX = Number.MAX_VALUE;
  let maxX = -Number.MAX_VALUE;
  let minY = Number.MAX_VALUE;
  let maxY = -Number.MAX_VALUE;
  let length = 0;
  spline.forEach((curve) => {
    const curveForBezierAnalysis = [curve.p0, curve.p1, curve.p2, curve.p3];
    const bezierAnalyzer = new BezierAnalyzer(curveForBezierAnalysis);
    const bbox = bezierAnalyzer.bbox();
    if (bbox.x.min < minX) minX = bbox.x.min;
    if (bbox.x.max > maxX) maxX = bbox.x.max;
    if (bbox.y.min < minY) minY = bbox.y.min;
    if (bbox.y.max > maxY) maxY = bbox.y.max;
    length += bezierAnalyzer.length();
  });

  return {
    minX,
    maxX,
    minY,
    maxY,
    startPoint,
    endPoint,
    length,
  };
}

export default function WorkOutro({
  index,
}: Readonly<{
  index: number;
}>) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<[number, number] | undefined>();
  const sizeRef = useRef(size);

  // Cached DOM references — populated in the size effect, used in scroll handler
  const frontPathsRef = useRef<(SVGPathElement | null)[]>([null, null, null, null]);
  const backPathsRef = useRef<(SVGPathElement | null)[]>([null, null, null, null]);
  const pathLengthsRef = useRef<number[]>([0, 0, 0, 0]);
  const backPathLengthsRef = useRef<number[]>([0, 0, 0, 0]);
  const prevDiffRef = useRef<number>(-1);

  const { scroll } = useLocomotiveScroll();
  const debouncer = useDebounce();

  const updateSize = useCallback(() => {
    debouncer(() => {
      const newSize = [
        document.documentElement.clientWidth,
        document.documentElement.clientHeight,
      ] as [number, number];
      setSize(newSize);
      sizeRef.current = newSize;
    });
  }, [debouncer]);

  useLayoutEffect(() => {
    incrementEventHandlerCount("resize-workoutro");
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => {
      decrementEventHandlerCount("resize-workoutro");
      window.removeEventListener("resize", updateSize);
    };
  }, [updateSize]);

  useEffect(() => {
    if (scroll) {
      incrementEventHandlerCount("scroll-workoutro");
      scroll.on("scroll", (obj: any) => {
        markHandlerStart(`workoutro-${index}`);
        if (!sizeRef.current) return;
        const key = `work-${index}-outro-animate`;
        if (!(key in obj.currentElements)) return;

        const third = sizeRef.current[1] / 3;
        const diff = Math.max(
          0,
          Math.min(
            1,
            (1.0 +
              (obj.scroll.y - obj.currentElements[key].top) /
                sizeRef.current[1]) *
              1.25
          )
        );

        // Skip all DOM work if diff hasn't changed enough
        const quantized = Math.round(diff * 1000);
        if (quantized === Math.round(prevDiffRef.current * 1000)) return;
        prevDiffRef.current = diff;

        // Foreground paths — use cached refs & pathLengths
        for (let i = 0; i < 4; i++) {
          const path = frontPathsRef.current[i];
          if (!path) continue;
          const length = pathLengthsRef.current[i];

          let startOffset: number;
          let endOffsetGrowthSection: number;
          let endOffsetStop: number;

          if (i === 0) {
            startOffset = (length - third - 0.01) * diff;
            endOffsetGrowthSection = startOffset * 1.5;
            endOffsetStop = length - third * 0.46;
          } else if (i === 1) {
            startOffset = (length - third - 0.01) * diff;
            endOffsetGrowthSection = startOffset * 2;
            endOffsetStop = length;
          } else if (i === 2) {
            startOffset = (length - third - 0.01) * diff;
            endOffsetGrowthSection = startOffset * 2;
            endOffsetStop = length - third * 0.3;
          } else {
            startOffset = (length - third * 0.55) * diff;
            endOffsetGrowthSection = startOffset * 1.5;
            endOffsetStop = length - third * 0.3;
          }

          const dashLen =
            endOffsetGrowthSection < endOffsetStop
              ? endOffsetGrowthSection - startOffset
              : endOffsetStop - startOffset;

          path.setAttribute("stroke-dasharray", `${dashLen} ${length}`);
          path.setAttribute("stroke-dashoffset", `${-startOffset}`);
          path.setAttribute(
            "filter",
            `brightness(${0.5 + ((i / 4 + (1 - i / 4)) / 2) * diff})`
          );

          if (diff === 1) {
            path.setAttribute("class", "animate-glowpulse");
          } else {
            path.removeAttribute("class");
          }
        }

        // Background paths — use cached refs & pathLengths
        for (let i = 0; i < 4; i++) {
          const path = backPathsRef.current[i];
          if (!path) continue;
          const length = backPathLengthsRef.current[i];
          const backLength = Math.max(0, diff * length - (length - third));
          const dashOffset = length - third;
          path.setAttribute("stroke-dasharray", `${backLength} ${length}`);
          path.setAttribute("stroke-dashoffset", `-${dashOffset}`);
        }
        markHandlerEnd(`workoutro-${index}`);
      });
    }
  }, [scroll, index]);

  useEffect(() => {
    if (ref.current && size) {
      ref.current.innerHTML = "";
      prevDiffRef.current = -1;
      frontPathsRef.current = [null, null, null, null];
      backPathsRef.current = [null, null, null, null];
      const a = [0, 1, 2, 3];
      a.sort(() => Math.random() - 0.5);

      const third = size[1] / 3;
      const strokeWidth = (2 * third) / 11;
      const blurSize = 20;

      const frontSVGs = [];
      const backSVGs = [];

      for (let i = 0; i < 8; i++) {
        const moddedI = i % 4;
        const randomI = a[moddedI];
        const sx = ((moddedI + 1) * size[0]) / 5;
        const p0x = (size[0] - third) / 2 + (randomI * 3 + 1) * (third / 11);

        const minX = Math.min(sx, p0x);
        const maxX = Math.max(sx, p0x);

        const startX =
          (sx < p0x ? 0 : maxX - minX) + blurSize + strokeWidth / 2;
        const endX = (sx < p0x ? maxX - minX : 0) + blurSize + strokeWidth / 2;

        const spline = [
          {
            p0: {
              x: startX,
              y: size[1],
            },
            p1: {
              x: startX,
              y: ((2.35 + randomI * 0.1) * size[1]) / 3,
            },
            p2: {
              x: endX,
              y: ((2.35 + randomI * 0.1) * size[1]) / 3,
            },
            p3: {
              x: endX,
              y: third * 2,
            },
          },
          {
            p0: {
              x: endX,
              y: third * 2,
            },
            p1: {
              x: endX,
              y: third * 2,
            },
            p2: {
              x: endX,
              y: third,
            },
            p3: {
              x: endX,
              y: third,
            },
          },
        ];

        const svgPath = Path();

        svgPath.moveTo(spline[0].p0.x, spline[0].p0.y);
        spline.forEach((c) => {
          svgPath.curveTo(c.p1.x, c.p1.y, c.p2.x, c.p2.y, c.p3.x, c.p3.y);
        });

        svgPath.end();

        const bounds = getSplineBounds(spline);

        const svgns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgns, "svg") as SVGElement;
        svg.id = `logo-path-for-work-${index}-svg-${randomI}`;
        const width = bounds.maxX - bounds.minX + strokeWidth + blurSize * 2;
        svg.setAttributeNS(
          null,
          "style",
          `pointer-events: none; position: absolute; left: ${
            minX - strokeWidth / 2 - blurSize
          }px; top: ${0}px`
        );
        svg.setAttributeNS(null, "width", `${width}`);
        svg.setAttributeNS(null, "height", `${size[1]}`);

        const path = document.createElementNS(svgns, "path");
        path.setAttributeNS(null, "d", svgPath);
        path.setAttributeNS(null, "stroke-width", strokeWidth.toString());
        path.setAttributeNS(null, "fill", "transparent");
        path.setAttributeNS(
          null,
          "stroke-dasharray",
          `${bounds.length} ${bounds.length}`
        );
        path.setAttributeNS(null, "stroke-dashoffset", `0`);
        path.setAttributeNS(null, "pathLength", `${bounds.length}`);

        if (i < 4) {
          path.setAttributeNS(
            null,
            "id",
            `logo-path-for-work-${index}-path-${randomI}`
          );
          path.style.transition = "stroke 0.5s ease-in-out";
          path.style.stroke = "#AAAAAA";
          frontPathsRef.current[randomI] = path;
          pathLengthsRef.current[randomI] = bounds.length;
          frontSVGs.push(svg);
        } else {
          path.setAttributeNS(null, "stroke", "#202020");
          path.setAttributeNS(
            null,
            "id",
            `logo-path-for-work-${index}-path-${randomI}-background`
          );
          backPathsRef.current[randomI] = path;
          backPathLengthsRef.current[randomI] = bounds.length;
          backSVGs.push(svg);
        }

        svg.appendChild(path);
      }

      backSVGs.forEach((svg) => ref.current!.appendChild(svg));
      frontSVGs.forEach((svg) => ref.current!.appendChild(svg));
    }
  }, [ref, index, size]);

  return (
    <div
      id={`work-${index}-outro-container`}
      ref={ref}
      className="h-[100dvh] w-screen transition-[opacity] duration-1000 bg-[var(--dark)] absolute top-0 flex items-center justify-center"
      data-scroll
      data-scroll-repeat
      data-scroll-id={`work-${index}-outro-container`}
    ></div>
  );
}
