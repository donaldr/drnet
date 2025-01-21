"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { WorkData } from "./workitems";
import WorkNavigationItem from "./worknavigationitem";
import { useGlobalState, navigating } from "@/lib/state";
import clsx from "clsx";
import { useLocomotiveScroll } from "react-locomotive-scroll";

export default function WorkNavigator({
  works,
}: Readonly<{
  works: Array<WorkData>;
}>) {
  const mouseRef = useRef<{ x?: number; y?: number }>({});
  const [activeName] = useGlobalState("active");
  const [active, setActive] = useState(false);
  const [moving, setMoving] = useState(false);
  const [hover, setHover] = useState(false);

  const [workNavigatorClasses, setWorkNavigatorClasses] = useState(
    "opacity-0 transition-[opacity]"
  );
  const [show, setShow] = useState(false);
  const showRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppingMoveRef = useRef(false);
  const { scroll } = useLocomotiveScroll();

  useEffect(() => {
    if (activeName) {
      setActive(!!activeName.match(/work-\d+/));
    } else {
      setActive(false);
    }
  }, [activeName]);

  const mousemove = useCallback((e: MouseEvent) => {
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;
    if (!stoppingMoveRef.current) {
      if (moveRef.current) {
        clearTimeout(moveRef.current);
      }
      setMoving(true);
      moveRef.current = setTimeout(() => {
        setMoving(false);
        stoppingMoveRef.current = true;
        setTimeout(() => {
          stoppingMoveRef.current = false;
        }, 500);
      }, 500);
    }
  }, []);

  useEffect(() => {
    if (active) {
      if (showRef.current) {
        clearTimeout(showRef.current);
      }
      setShow(true);
    } else {
      showRef.current = setTimeout(() => {
        setShow(false);
      }, 500);
    }

    document.addEventListener("mousemove", mousemove);
    return () => document.removeEventListener("mousemove", mousemove);
  }, [active, mousemove]);

  useEffect(() => {
    if (scroll) {
      scroll.on("scroll", () => {
        if (!navigating.current) {
          if (!stoppingMoveRef.current) {
            if (moveRef.current) {
              clearTimeout(moveRef.current);
            }
            setMoving(true);
            moveRef.current = setTimeout(() => {
              setMoving(false);
              stoppingMoveRef.current = true;
              setTimeout(() => {
                stoppingMoveRef.current = false;
              }, 500);
            }, 500);
          }
        }
      });
    }
  }, [scroll]);

  useEffect(() => {
    setWorkNavigatorClasses(
      clsx({
        "absolute top-0 right-[1rem] w-[10rem] h-screen z-[200] flex items-center justify-end transition-[opacity] duration-500 cursor-pointer z-100":
          true,
        "pointer-events-none": !show,
        "opacity-0": !(active && show && (moving || hover)),
        "opacity-100": active && show && (moving || hover),
      })
    );
  }, [active, show, moving, hover]);

  return (
    <div
      id="work-navigator-container"
      className={workNavigatorClasses}
      data-scroll
      data-scroll-sticky
      data-scroll-target="#full"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        id="work-navigator"
        style={{
          height: `${works.length * 2.5 + (works.length - 1) * 0.5}rem`,
        }}
      >
        {works &&
          works.map((work, index) => (
            <WorkNavigationItem key={work.project} work={work} index={index} />
          ))}
      </div>
    </div>
  );
}
