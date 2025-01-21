'use client';

import { useEffect, useRef } from "react";
import { useLocomotiveScroll } from "react-locomotive-scroll";
import Path from "svg-path-generator";
import { Bezier as BezierAnalyzer } from "bezier-js";

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
        const curveForBezierAnalysis = [
            curve.p0,
            curve.p1,
            curve.p2,
            curve.p3,
        ];
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
}:
Readonly<{
  index: number;
}>)
{
  const ref = useRef<HTMLDivElement | null>(null);

  const { scroll } = useLocomotiveScroll();

  useEffect(() => {
    if(scroll)
    {
      scroll.on("scroll", (obj: any) => {
        const key = `work-${index}-outro-animate` 
        const third = window.innerHeight / 3; 
        if(key in obj.currentElements)
        {
          const diff = Math.max(0, Math.min(1, (1.0 + ((obj.scroll.y - obj.currentElements[key].top) / window.innerHeight)) * 1.25));
          for(let i = 0; i < 4; i++)
          {
            const path = document.getElementById(`logo-path-for-work-${index}-path-${i}`);
            const length = parseFloat(parseFloat(path?.getAttribute("pathLength")?.valueOf() || "0").toFixed(2));

            if(i == 0)
            {
              const startOffset = (length - third) * diff;
              const endOffsetGrowthSection = startOffset * 1.5;
              const endOffsetStop = length - (third * 0.46);
              path?.setAttributeNS(
                  null,
                  "stroke-dasharray",
                  `${endOffsetGrowthSection < endOffsetStop ? endOffsetGrowthSection - startOffset : endOffsetStop - startOffset} ${length}`,
              );
              path?.setAttributeNS(null, "stroke-dashoffset", `${-startOffset}`);
            }
            if(i == 1)
            {
              const startOffset = (length - third) * diff;
              const endOffsetGrowthSection = startOffset * 2;
              const endOffsetStop = length;
              path?.setAttributeNS(
                  null,
                  "stroke-dasharray",
                  `${endOffsetGrowthSection < endOffsetStop ? endOffsetGrowthSection - startOffset : endOffsetStop - startOffset} ${length}`,
              );
              path?.setAttributeNS(null, "stroke-dashoffset", `${-startOffset}`);
            }
            else if(i == 2)
            {
              const startOffset = (length - third) * diff;
              const endOffsetGrowthSection = startOffset * 2;
              const endOffsetStop = length - (third * 0.3);
              path?.setAttributeNS(
                  null,
                  "stroke-dasharray",
                  `${endOffsetGrowthSection < endOffsetStop ? endOffsetGrowthSection - startOffset : endOffsetStop - startOffset} ${length}`,
              );
              path?.setAttributeNS(null, "stroke-dashoffset", `${-startOffset}`);
            }
            else if(i == 3)
            {
              const startOffset = (length - (third * 0.55)) * diff;
              const endOffsetGrowthSection = startOffset * 1.5;
              const endOffsetStop = length - (third * 0.3);
              path?.setAttributeNS(
                  null,
                  "stroke-dasharray",
                  `${endOffsetGrowthSection < endOffsetStop ? endOffsetGrowthSection - startOffset : endOffsetStop - startOffset} ${length}`,
              );
              path?.setAttributeNS(null, "stroke-dashoffset", `${-startOffset}`);
            }
            path?.setAttributeNS(null, "filter", `brightness(${(0.5 + ((((i / 4) + (1 - (i / 4))) / 2)) * diff)})`);
            if(diff == 1)
            {
              path?.setAttributeNS(null, "class", "animate-glowpulse");
              path?.setAttributeNS(
                  null,
                  "style",
                  `transition: stroke 0.5s ease-in-out; stroke: #AAAAAA;`,
              );
            }
            else
            {
              path?.setAttributeNS(null, "class", "");
              path?.setAttributeNS(
                  null,
                  "style",
                  `transition: stroke 0.5s ease-in-out; stroke: #AAAAAA;`,
              );
            }
          }
          for(let i = 0; i < 4; i++)
          {
            const path = document.getElementById(`logo-path-for-work-${index}-path-${i}-background`);
            const length = parseFloat(parseFloat(path?.getAttribute("pathLength")?.valueOf() || "0").toFixed(2));
            const backLength = Math.max(0, (diff * length - (length - third)));
            path?.setAttributeNS(
                null,
                "stroke-dasharray",
                `${backLength} ${length}`,
            );
            path?.setAttributeNS(null, "stroke-dashoffset", `-${Math.min(length - third, Math.max(0, length - third))}`);
          }
        }
      });
    }
  }, [scroll, index]);

  useEffect(() => {
    if(ref.current)
    {
      const a = [0,1,2,3];
      a.sort( () => Math.random()-0.5 );

      const third = window.innerHeight / 3; 
      const strokeWidth = 2 * third / 11;
      const blurSize = 20;

      const frontSVGs = [];
      const backSVGs = [];
      
      for(let i = 0; i < 8; i++)
      {
        const moddedI = i % 4;
        const randomI = a[moddedI];
        const sx = (moddedI + 1) * window.innerWidth / 5;
        const p0x = ((window.innerWidth - third) / 2) + (randomI * 3 + 1) * (third / 11);

        const minX = Math.min(sx, p0x);
        const maxX = Math.max(sx, p0x);

        const startX = (sx < p0x ? 0 : maxX - minX) + blurSize + strokeWidth / 2;
        const endX = (sx < p0x ? maxX - minX : 0) + blurSize + strokeWidth / 2;

        const spline = [
          {
            p0: {
              x: startX, 
              y: window.innerHeight
            }, 
            p1: {
              x: startX, 
              y: (2.35 + (randomI * 0.1)) * window.innerHeight / 3
            }, 
            p2: {
              x: endX, 
              y: (2.35 + (randomI * 0.1)) * window.innerHeight / 3
            }, 
            p3: {
              x: endX, 
              y: third *2
            }
          },
          {
            p0: {
              x: endX, 
              y: third *2
            }, 
            p1: {
              x: endX, 
              y: third *2
            }, 
            p2: {
              x: endX, 
              y: third
            }, 
            p3: {
              x: endX, 
              y: third
            }
          },
        ]; 

        const svgPath = Path();

        svgPath.moveTo(spline[0].p0.x, spline[0].p0.y);
        spline.forEach((c) => {
            svgPath.curveTo(
                c.p1.x,
                c.p1.y,
                c.p2.x,
                c.p2.y,
                c.p3.x,
                c.p3.y,
            );
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
            `pointer-events: none; position: absolute; left: ${minX - (strokeWidth / 2) - blurSize}px; top: ${0}px`,
        );
        svg.setAttributeNS(null, "width", `${width}`);
        svg.setAttributeNS(null, "height", `${window.innerHeight}`);

        const path = document.createElementNS(svgns, "path");
        path.setAttributeNS(
            null,
            "d",
            svgPath,
        );
        path.setAttributeNS(null, "stroke-width", strokeWidth.toString());
        path.setAttributeNS(null, "fill", "transparent");
        path.setAttributeNS(
            null,
            "stroke-dasharray",
            `${bounds.length} ${bounds.length}`,
        );
        path.setAttributeNS(null, "stroke-dashoffset", `0`);
        path.setAttributeNS(null, "pathLength", `${bounds.length}`);

        if(i < 4)
        {
          path.setAttributeNS(null, "id", `logo-path-for-work-${index}-path-${randomI}`);
          frontSVGs.push(svg);
        }
        else
        {
          path.setAttributeNS(null, "stroke", "#202020");
          path.setAttributeNS(null, "id", `logo-path-for-work-${index}-path-${randomI}-background`);
          backSVGs.push(svg);
        }

        svg.appendChild(path);
      }

      backSVGs.forEach(svg => ref.current!.appendChild(svg));
      frontSVGs.forEach(svg => ref.current!.appendChild(svg));
    }
  }, [ref, index]);

  return (
    <div 
      id={`work-${index}-outro-container`}
      ref={ref} 
      className="h-screen w-screen transition-[opacity] duration-1000 will-change-[opacity,transform] bg-[var(--dark)] absolute top-0 flex items-center justify-center animate-glowpulse"
      data-scroll data-scroll-repeat data-scroll-id={`work-${index}-outro-container`}
      >
    </div>
  )
}