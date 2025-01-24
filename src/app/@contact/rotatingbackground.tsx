"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useThrottle } from "@/lib/customhooks";
import React from "react";
import { Hsluv } from "hsluv";
import LinkText from "./linktext";

const conv = new Hsluv();

function RotatingBackground({
  active,
}: Readonly<{
  active: boolean;
}>) {
  const [t, setT] = useState(0);
  const mouseRef = useRef<{ x?: number; y?: number }>({});
  const leanRef = useRef(0.5);
  const topRef = useRef(true);
  const [smoothedLean, setSmoothedLean] = useState(0.5);
  const [smoothedVerticalLean, setSmoothedVerticalLean] = useState(0.5);
  const [smoothedOffsetTop, setSmoothedOffsetTop] = useState(0);
  const [smoothedOffsetBottom, setSmoothedOffsetBottom] = useState(0);
  const activeRef = useRef(active);

  const requestRef = useRef<number>(0);
  const throttle = useThrottle();

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const animate = useCallback(() => {
    setT(Date.now() / 100);
    if (mouseRef.current.y !== undefined) {
      setTimeout(() => {
        throttle(
          () =>
            (leanRef.current =
              mouseRef.current.y! < 0.5
                ? mouseRef.current.x!
                : 1 - mouseRef.current.x!),
          10
        );
      }, 1000);
      setSmoothedLean((prev) => prev * 0.9 + leanRef.current * 0.1);
      if (mouseRef.current.y) {
        setSmoothedVerticalLean(
          (prev) => prev * 0.9 + mouseRef.current.y! * 0.1
        );
      }
      if (mouseRef.current.y < 0.5) {
        topRef.current = true;
        setSmoothedOffsetTop((prev) => prev * 0.98 + 0.02);
        setSmoothedOffsetBottom((prev) => prev * 0.99 + 0.01);
      } else {
        topRef.current = false;
        setSmoothedOffsetTop((prev) => prev * 0.99 - 0.01);
        setSmoothedOffsetBottom((prev) => prev * 0.98 - 0.02);
      }
    }

    if (activeRef.current) {
      requestAnimationFrame(animate);
    }
  }, [throttle]);

  const mouse = useCallback((e: MouseEvent) => {
    const x = e.clientX / document.documentElement.clientWidth;
    const y = e.clientY / document.documentElement.clientHeight;
    mouseRef.current = { x, y };
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", mouse);
    return () => document.removeEventListener("mousemove", mouse);
  }, [mouse]);

  useEffect(() => {
    if (active) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate, active]);

  conv.hsluv_h = t % 360;
  conv.hsluv_s = 94;
  conv.hsluv_l = 82;
  conv.hsluvToHex();

  const topStartColor = conv.hex;

  conv.hsluv_h = (t + 30) % 360;
  conv.hsluv_s = 94;
  conv.hsluv_l = 72;
  conv.hsluvToHex();

  const topEndColor = conv.hex;

  conv.hsluv_h = (t + 180) % 360;
  conv.hsluv_s = 94;
  conv.hsluv_l = 82;
  conv.hsluvToHex();

  const bottomStartColor = conv.hex;

  conv.hsluv_h = (t + 210) % 360;
  conv.hsluv_s = 94;
  conv.hsluv_l = 72;
  conv.hsluvToHex();

  const bottomEndColor = conv.hex;

  return (
    <>
      <div
        className="w-[300dvw] h-[100dvh] absolute top-[-50dvh] left-[-100dvw] z-40 will-change-transform overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${topStartColor} 25%, ${topEndColor} 75%)`,
          transformOrigin: "bottom center",
          transform: `translateY(${smoothedOffsetTop * 10}dvh) rotateZ(${
            (smoothedLean - 0.5) * 30
          }deg)`,
          boxShadow: `0 0 30px 10px hsl(${t % 360} 20% 50%/75%)`,
          zIndex: topRef.current ? "100" : "50",
          perspective: "40dvw",
        }}
      >
        <div
          className="w-full h-full absolute z-40 will-change-transform heavy-grain flex items-center justify-center"
          style={{
            transformOrigin: "bottom center",
            transform: `rotateZ(${-(smoothedLean - 0.5) * 30}deg) translateY(${
              smoothedOffsetTop * -10 + 20
            }dvh) rotateY(${-(smoothedLean - 0.5) * 15}deg) rotateX(${
              (smoothedVerticalLean - 0.25) * 10
            }deg)`,
          }}
        >
          <div className="mt-[15dvh] cursor-pointer">
            <LinkText
              activeOver={topRef.current}
              active={active}
              text="me@donaldrichardson.net"
              doCopy={true}
            />
          </div>
        </div>
      </div>
      <div
        className="w-[300dvw] h-[100dvh] absolute top-[50dvh] left-[-100dvw] z-40 will-change-transform overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${bottomStartColor} 25%, ${bottomEndColor} 75%)`,
          transformOrigin: "top center",
          transform: `translateY(${smoothedOffsetBottom * 10}dvh) rotateZ(${
            (smoothedLean - 0.5) * 30
          }deg)`,
          boxShadow: `0 0 30px 10px hsl(${(t + 180) % 360} 20% 50%/75%)`,
          zIndex: topRef.current ? "50" : "100",
          perspective: "40dvw",
        }}
      >
        <div
          className="w-full h-full absolute z-40 will-change-transform heavy-grain flex items-center justify-center"
          style={{
            transformOrigin: "top center",
            transform: `rotateZ(${
              -(smoothedLean - 0.5) * 30
            }deg) translateY(-20dvh) rotateY(${
              (smoothedLean - 0.5) * 15
            }deg) rotateX(${(smoothedVerticalLean - 0.75) * 10}deg)`,
          }}
        >
          <div className="mt-[-15dvh]">
            <a
              href="https://www.linkedin.com/in/donald-g-richardson/"
              target="_blank"
            >
              <LinkText
                activeOver={!topRef.current}
                active={active}
                text="LinkedIn"
                phase={180}
              />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default React.memo(RotatingBackground);
