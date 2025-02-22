"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { WorkData } from "./workitems";
import WorkNavigationItem from "./worknavigationitem";
import {
  useGlobalState,
  navigating,
  incrementEventHandlerCount,
  decrementEventHandlerCount,
} from "@/lib/state";
import clsx from "clsx";
import { useLocomotiveScroll } from "@/lib/locomotive";

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
  const hoverRef = useRef(hover);

  const [workNavigatorClasses, setWorkNavigatorClasses] = useState(
    "opacity-0 transition-[opacity]"
  );
  const [show, setShow] = useState(false);
  const showRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppingMoveRef = useRef(false);
  const { scroll } = useLocomotiveScroll();

  useEffect(() => {
    hoverRef.current = hover;
  }, [hover]);

  useEffect(() => {
    if (activeName) {
      setActive(!!activeName.match(/work-\d+/));
    } else {
      setActive(false);
    }
  }, [activeName]);

  const pointermove = useCallback((e: PointerEvent) => {
    if (e.pointerType == "mouse") {
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

    if (active) {
      incrementEventHandlerCount("pointermove-worknav");
      document.addEventListener("pointermove", pointermove);
    }
    return () => {
      decrementEventHandlerCount("pointermove-worknav");
      document.removeEventListener("pointermove", pointermove);
    };
  }, [active, pointermove]);

  useEffect(() => {
    if (scroll) {
      incrementEventHandlerCount("scroll-worknav");
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
        "absolute top-0 right-[1rem] w-[0rem] h-[100dvh] z-[200] flex items-center justify-end transition-[opacity] duration-500 cursor-pointer z-100":
          true,
        "pointer-events-none": !show,
        "opacity-0": !(active && show && (moving || hover)),
        "opacity-100": active && show && (moving || hover),
      })
    );
  }, [active, show, moving, hover]);

  const pointerDownElsewhere = useCallback((e: PointerEvent) => {
    const target: HTMLElement = e.target as HTMLElement;
    if (
      e.pointerType == "touch" &&
      hoverRef.current &&
      (!target || target.closest("#work-navigator"))
    ) {
      console.log("hover false!");
      setHover(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.addEventListener(
      "pointerdown",
      pointerDownElsewhere
    );
    return () => {
      document.documentElement.removeEventListener(
        "pointerdown",
        pointerDownElsewhere
      );
    };
  }, [pointerDownElsewhere]);

  return (
    <div
      id="work-navigator-container"
      className={workNavigatorClasses}
      data-scroll
      data-scroll-sticky
      data-scroll-target="#full"
      onPointerEnter={(e: React.PointerEvent<HTMLElement>) => {
        if (e.pointerType == "mouse") {
          setHover(true);
        }
      }}
      onPointerLeave={(e: React.PointerEvent<HTMLElement>) => {
        if (e.pointerType == "mouse") {
          setHover(false);
        }
      }}
    >
      <div
        id="work-navigator"
        style={{
          height: `${works.length * 2.5 + (works.length - 1) * 0.5}rem`,
        }}
      >
        {works &&
          works.map((work, index) => (
            <WorkNavigationItem
              parentHover={hover}
              setParentHover={setHover}
              key={work.project}
              work={work}
              index={index}
            />
          ))}
      </div>
    </div>
  );
}
