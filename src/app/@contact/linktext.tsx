"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import SVGStroke from "@/lib/svgstroke";
import { useLineText } from "@/lib/linetext";
import React from "react";
import { Hsluv } from "hsluv";

const conv = new Hsluv();

function LinkText({
  active,
  activeOver,
  text,
  phase = 0,
  doCopy = false,
}: Readonly<{
  active: boolean;
  activeOver: boolean;
  text: string;
  phase?: number;
  doCopy?: boolean;
}>) {
  const [offset, setOffset] = useState(0);
  const [t, setT] = useState(0);
  const [hover, setHover] = useState(0);
  const [copy, setCopy] = useState(0);
  const hoverRef = useRef(false);
  const activeOverRef = useRef(false);
  const activeRef = useRef(false);
  const [width, setWidth] = useState(0);

  const textPathRef = useRef<Array<SVGPathElement | null>>([]);
  const linkText = useLineText(text, width / (text.length * 0.75));
  const lineRef = useRef<SVGPathElement | null>(null);
  const requestRef = useRef<number>(0);
  const [copyText, setCopyText] = useState("click to copy");
  const copyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedRef = useRef(false);

  const resize = useCallback(() => {
    setWidth(document.documentElement.clientWidth);
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    activeOverRef.current = activeOver;
  }, [activeOver]);

  const animate = useCallback(() => {
    setOffset((prev) => prev * 0.99 + (activeOverRef.current ? 0.01 : 0));
    setT(Date.now() / 100);
    setHover((prev) => prev * 0.95 + (hoverRef.current ? 0.05 : 0));
    setCopy(
      (prev) =>
        prev * 0.95 + (hoverRef.current && !copiedRef.current ? 0.05 : 0)
    );

    if (activeRef.current) {
      requestAnimationFrame(animate);
    }
  }, []);

  useEffect(() => {
    if (hover <= 0.01) {
      setCopyText("click to copy");
      copiedRef.current = false;
      if (copyRef.current) {
        clearTimeout(copyRef.current);
      }
    }
  }, [hover]);

  useEffect(() => {
    if (active) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate, active]);

  conv.hsluv_h = (t + phase) % 360;
  conv.hsluv_s = 94;
  conv.hsluv_l = 42;
  conv.hsluvToHex();

  const color = conv.hex;

  return (
    linkText &&
    linkText.paths && (
      <div
        onMouseEnter={() => (hoverRef.current = true)}
        onMouseLeave={() => (hoverRef.current = false)}
        onClick={async () => {
          if (doCopy) {
            await navigator.clipboard.writeText(text);
            setCopyText("copied");
            copiedRef.current = false;
            copyRef.current = setTimeout(() => {
              copiedRef.current = true;
            }, 1000);
          }
        }}
      >
        <svg
          width={linkText.width}
          height={linkText.height! * 1.2}
          viewBox={`0 0 ${linkText.width} ${linkText.height! * 1.2}`}
          className="z-[150]"
        >
          {linkText.paths.map((path: string, index: number) => (
            <SVGStroke
              key={`path${index}`}
              fill="none"
              stroke="#000"
              startStroke={0}
              strokeLength={1}
              svgPath={textPathRef.current[index]}
              renderSVGPath={() => {
                return (
                  <path
                    ref={(el) => {
                      textPathRef.current[index] = el;
                    }}
                    d={path}
                    pathLength={1}
                    style={{
                      fill: "none",
                      stroke: color,
                      strokeDashoffset: `${-Math.max(
                        0,
                        Math.min(1, offset * 2 - (index + 5) / 40)
                      )}`,
                      strokeDasharray: `${Math.max(
                        0,
                        Math.min(1, offset * 2 - (index + 5) / 40)
                      )} ${
                        1 -
                        Math.max(0, Math.min(1, offset * 2 - (index + 5) / 40))
                      }`,
                    }}
                  />
                );
              }}
            />
          ))}
          <SVGStroke
            fill="none"
            stroke={color}
            strokeWidth={1}
            startStroke={0}
            strokeLength={hover}
            svgPath={lineRef.current}
            renderSVGPath={(pathCSS: React.CSSProperties) => {
              return (
                <path
                  ref={(el) => {
                    lineRef.current = el;
                  }}
                  d={
                    linkText.width
                      ? `M 0 ${Math.floor(linkText.height! * 1.1)}L ${
                          linkText.width
                        } ${Math.floor(linkText.height! * 1.1)}`
                      : ""
                  }
                  style={pathCSS}
                />
              );
            }}
          />
        </svg>
        {doCopy && (
          <div
            className="text-center text-xs"
            style={{
              color: color,
              opacity: copy,
            }}
          >
            {copyText}
          </div>
        )}
      </div>
    )
  );
}

export default React.memo(LinkText);
