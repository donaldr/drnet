import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const [fitClasses, setFitClasses] = useState("");
  const [reveal, setReveal] = useState(false);
  const [offset, setOffset] = useState<number>();
  const { scroll } = useLocomotiveScroll();
  const showRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        "transition-all": true,
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

  useLayoutEffect(() => {
    function getMousePosition(e: MouseEvent) {
      setCursorPosition([e.clientX, e.clientY]);
    }
    function getTouchStart(e: TouchEvent) {
      setCursorPosition([e.touches[0].clientX, e.touches[0].clientY]);
    }
    function getTouchMovePosition(e: TouchEvent) {
      setCursorPosition([
        e.changedTouches[0].clientX,
        e.changedTouches[0].clientY,
      ]);
    }
    if (show && reveal) {
      window.addEventListener("mousemove", getMousePosition);
      window.addEventListener("touchstart", getTouchStart);
      window.addEventListener("touchmove", getTouchMovePosition);
    }
    return () => {
      window.removeEventListener("mousemove", getMousePosition);
      window.removeEventListener("touchstart", getTouchStart);
      window.removeEventListener("touchmove", getTouchMovePosition);
    };
  }, [show, reveal]);

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
        className="font-[fit-variable] tracking-[1vw] relative w-full h-[100vh] flex items-center justify-center z-10"
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
                        height: `min(60vh,${(3 * 75) / textLength}vw)`,
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
                          fontSize: `min(80vh,${(3 * 100) / textLength}vw)`,
                          lineHeight: `min(80vh,${(3 * 100) / textLength}vw)`,
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
              top: `min(60vh,${(3 * 75) / textLength}vw)`,
            }}
          >
            {
              //@ts-expect-error SplitText somehow doesn't expect children
              <SplitText
                LetterWrapper={({ letterIndex, children }: any) => (
                  <span className="relative inline-block">
                    <span
                      style={{
                        height: `min(60vh,${(3 * 75) / textLength}vw)`,
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
                          fontSize: `min(80vh,${(3 * 100) / textLength}vw)`,
                          lineHeight: `min(80vh,${(3 * 100) / textLength}vw)`,
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
                        height: `min(60vh,${(3 * 75) / textLength}vw)`,
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
                        fontSize: `min(80vh,${(3 * 100) / textLength}vw)`,
                        lineHeight: `min(80vh,${(3 * 100) / textLength}vw)`,
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
