import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { SplitText } from "@rigo-m/react-split-text";
import clsx from "clsx";
import { useLocomotiveScroll } from "react-locomotive-scroll";
//import { useOffset } from "@/lib/customHooks";

export default function FitVariable({
  show = false,
  children,
}: Readonly<{
  show: boolean;
  children: React.ReactNode;
}>) {
  const [size, setSize] = useState([0, 0]);
  const [cursorPosition, setCursorPosition] = useState([0, 0]);
  const animateToPositionRef = useRef<[number, number]>(null);
  const [fitClasses, setFitClasses] = useState("");
  const [reveal, setReveal] = useState(false);
  const [offset, setOffset] = useState<number>();
  const { scroll } = useLocomotiveScroll();
  const showRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    if (scroll) {
      scroll.on("scroll", (obj: any) => {
        if ("home-target" in obj.currentElements) {
          setOffset(
            Math.min(1, obj.scroll.y / document.documentElement.clientHeight)
          );
        }
      });
    }
  }, [scroll]);

  useLayoutEffect(() => {
    setFitClasses(
      clsx({
        absolute: true,
        "w-full": true,
        "h-full": true,
        hidden: !show && !reveal,
        "duration-1000": true,
        "opacity-100": show && reveal,
        "opacity-0": (show && !reveal) || (!show && reveal),
        "transition-opacity": true,
        "will-change-opacity": true,
        "bg-slate-300": true,
        "heavy-grain": true,
      })
    );
    if (show) {
      if (showRef.current) {
        clearTimeout(showRef.current);
      }
      showRef.current = setTimeout(() => {
        setReveal(true);
      }, 10);
    } else {
      if (showRef.current) {
        clearTimeout(showRef.current);
      }
      showRef.current = setTimeout(() => {
        setReveal(false);
      }, 1000);
    }
  }, [show, reveal]);

  useLayoutEffect(() => {
    function updateSize() {
      setSize([
        document.documentElement.clientWidth,
        document.documentElement.clientHeight,
      ]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    setCursorPosition([
      document.documentElement.clientWidth / 2,
      document.documentElement.clientHeight / 2,
    ]);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const animate = useCallback(() => {
    requestRef.current = requestAnimationFrame(animate);
    setCursorPosition((prev) => {
      if (prev) {
        const newCoords = [
          prev[0] * 0.9 + animateToPositionRef.current![0] * 0.1,
          prev[1] * 0.9 + animateToPositionRef.current![1] * 0.1,
        ];
        if (
          Math.round(newCoords[0]) ==
            Math.round(animateToPositionRef.current![0]) &&
          Math.round(newCoords[1]) ==
            Math.round(animateToPositionRef.current![1])
        ) {
          cancelAnimationFrame(requestRef.current);
        }
        return [...newCoords];
      } else {
        cancelAnimationFrame(requestRef.current);
        return [...animateToPositionRef.current!];
      }
    });
  }, []);

  useLayoutEffect(() => {
    function mousemove(e: MouseEvent) {
      setCursorPosition([e.clientX, e.clientY]);
    }
    function touchstart(e: TouchEvent) {
      animateToPositionRef.current = [
        e.touches[0].clientX,
        e.touches[0].clientY,
      ];
      cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(animate);
    }
    function touchmove(e: TouchEvent) {
      cancelAnimationFrame(requestRef.current);
      setCursorPosition([
        e.changedTouches[0].clientX,
        e.changedTouches[0].clientY,
      ]);
    }
    if (show && reveal) {
      window.addEventListener("mousemove", mousemove);
      window.addEventListener("touchstart", touchstart);
      window.addEventListener("touchmove", touchmove);
    }
    return () => {
      window.removeEventListener("mousemove", mousemove);
      window.removeEventListener("touchstart", touchstart);
      window.removeEventListener("touchmove", touchmove);
    };
  }, [show, reveal, animate]);

  const textLength = children!.toString().length;

  return (
    <div className={fitClasses}>
      <div
        className="absolute w-full h-full z-20"
        style={{
          background: `radial-gradient(ellipse at ${
            (100 * cursorPosition[0]) / size[0]
          }% ${
            (100 * cursorPosition[1]) / size[1]
          }%, rgba(255, 255, 255, 0.4), rgba(0, 0, 0, 0.5))`,
          mixBlendMode: "normal",
        }}
      ></div>
      <div
        className="font-[fit-variable] tracking-[1dvw] relative w-full h-[100dvh] flex items-center justify-center z-10"
        style={{
          //transform: `translateY(${offset ? offset * -100: 0}px)`
          opacity: offset ? 1 - offset : 1,
        }}
      >
        <div className="relative">
          <div className="relative z-30 text-white">
            {
              //@ts-expect-error SplitText somehow doesn't expect children
              <SplitText
                LetterWrapper={({ letterIndex, children }: any) => (
                  <span className="relative inline-block">
                    <span
                      style={{
                        height: `min(60dvh,${(3 * 75) / textLength}dvw)`,
                        textShadow: `0px 0px ${
                          3 *
                          Math.pow(
                            Math.cos(
                              (cursorPosition[0] / size[0] -
                                letterIndex / textLength) *
                                Math.PI *
                                2
                            ) *
                              0.5 +
                              0.5,
                            1
                          )
                        }px #FFF`,
                        zoom: offset ? 1 - offset * 0.5 : 1,
                      }}
                      className="wrapper relative left-0 z-20 inline-block"
                    >
                      <span
                        style={{
                          fontVariationSettings: `"wdth" ${Math.floor(
                            250 +
                              200 *
                                Math.pow(
                                  Math.cos(
                                    (cursorPosition[0] / size[0] -
                                      letterIndex / textLength) *
                                      Math.PI *
                                      2
                                  ) *
                                    0.5 +
                                    0.5,
                                  1
                                )
                          )}`,
                          fontSize: `min(80dvh,${(3 * 100) / textLength}dvw)`,
                          lineHeight: `min(80dvh,${(3 * 100) / textLength}dvw)`,
                        }}
                        className="align-text-top"
                      >
                        {children}
                      </span>
                    </span>
                  </span>
                )}
              >
                {children}
              </SplitText>
            }
          </div>
          <div
            className="absolute z-30 text-white left-0"
            style={{
              transform: "rotateZ(180deg) scaleX(-1)",
              zoom: offset ? 1 - offset * 0.5 : 1,
              top: `min(60dvh,${(3 * 75) / textLength}dvw)`,
            }}
          >
            {
              //@ts-expect-error SplitText somehow doesn't expect children
              <SplitText
                LetterWrapper={({ letterIndex, children }: any) => (
                  <span className="relative inline-block">
                    <span
                      style={{
                        height: `min(60dvh,${(3 * 75) / textLength}dvw)`,
                      }}
                      className="wrapper relative left-0 z-20 inline-block"
                    >
                      <span
                        style={{
                          fontVariationSettings: `"wdth" ${Math.floor(
                            250 +
                              200 *
                                Math.pow(
                                  Math.cos(
                                    (cursorPosition[0] / size[0] -
                                      letterIndex / textLength) *
                                      Math.PI *
                                      2
                                  ) *
                                    0.5 +
                                    0.5,
                                  1
                                )
                          )}`,
                          fontSize: `min(80dvh,${(3 * 100) / textLength}dvw)`,
                          lineHeight: `min(80dvh,${(3 * 100) / textLength}dvw)`,
                          opacity:
                            0.1 +
                            0.3 *
                              Math.pow(
                                Math.cos(
                                  (cursorPosition[0] / size[0] -
                                    letterIndex / textLength) *
                                    Math.PI *
                                    2
                                ) *
                                  0.5 +
                                  0.5,
                                1
                              ),
                          background: `linear-gradient(transparent, #FFF 80%)`,
                          backgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          mixBlendMode: "multiply",
                        }}
                        className="align-text-top"
                      >
                        {children}
                      </span>
                    </span>
                  </span>
                )}
              >
                {children}
              </SplitText>
            }
          </div>
          <div className="absolute left-0 top-0 z-10">
            {
              //@ts-expect-error SplitText somehow doesn't expect children
              <SplitText
                LetterWrapper={({ letterIndex, children }: any) => (
                  <span
                    className="relative inline-block"
                    style={{
                      perspective: "1000px",
                      zoom: offset ? 1 - offset * 0.5 : 1,
                    }}
                  >
                    <span
                      style={{
                        height: `min(60dvh,${(3 * 75) / textLength}dvw)`,
                        transform: `skew(${
                          -(
                            letterIndex / textLength -
                            0.5 -
                            ((cursorPosition[0] / size[0]) * 10 - 5)
                          ) * 10
                        }deg) scaleY(${
                          1.0 + 10.0 * (cursorPosition[1] / size[1])
                        }) rotateX(-80deg)`,
                        transformOrigin: "bottom center",
                        fontVariationSettings: `"wdth" ${Math.floor(
                          250 +
                            200 *
                              Math.pow(
                                Math.cos(
                                  (cursorPosition[0] / size[0] -
                                    letterIndex / textLength) *
                                    Math.PI *
                                    2
                                ) *
                                  0.5 +
                                  0.5,
                                1
                              )
                        )}`,
                        fontSize: `min(80dvh,${(3 * 100) / textLength}dvw)`,
                        lineHeight: `min(80dvh,${(3 * 100) / textLength}dvw)`,
                        filter: "blur(2px)",
                        opacity: "1.0",
                        background: "linear-gradient(#00000000, #000000AA)",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        mixBlendMode: "multiply",
                      }}
                      className="wrapper inline-block text-black z-10"
                    >
                      <span style={{}} className="inline-block">
                        {children}
                      </span>
                    </span>
                  </span>
                )}
              >
                {children}
              </SplitText>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
