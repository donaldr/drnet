"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useGlobalState } from "@/lib/state";
import SVGStroke from "@/lib/svgstroke";
import { useLocomotiveScroll } from "react-locomotive-scroll";
import HeaderTitle from "../headertitle";
import { useLineText } from "@/lib/linetext";
import Squares from "../squares";
import NoSSR from "react-no-ssr";

enum HoverState {
  INIT = "init",
  HOVERING = "hovering",
  UNHOVERING = "unhovering",
}

export default function ResumeRenderPage() {
  const [resumeClasses, setResumeClasses] = useState("opacity-0");
  const [containerClasses, setContainerClasses] = useState("");
  const [activeName] = useGlobalState("active");
  const active = useMemo(() => {
    return activeName == "resume";
  }, [activeName]);
  const [inViews] = useGlobalState("inView");
  const inView = useMemo(() => {
    inViews.includes("resume");
  }, [inViews]);
  const [hover, setHover] = useState(HoverState.INIT);

  const iconPathRef = useRef<Array<SVGPathElement | null>>([]);
  const textPathRef = useRef<Array<SVGPathElement | null>>([]);
  const lineRef = useRef<SVGPathElement | null>(null);
  const clickToDownloadText = useLineText("CLICK TO DOWNLOAD", 16);
  const [height, setHeight] = useState(0);

  const [offset0, setOffset0] = useState(0);
  const [offset1, setOffset1] = useState(0);
  const [offset2, setOffset2] = useState(0);
  const [offset3, setOffset3] = useState(0);
  const [offset4, setOffset4] = useState(0);
  const [offset5, setOffset5] = useState(0);
  const [offset6, setOffset6] = useState(0);
  const [offset7, setOffset7] = useState(0);
  const [offset8, setOffset8] = useState(0);
  const [offsetText, setOffsetText] = useState(0);
  const { scroll } = useLocomotiveScroll();

  const resize = useCallback(() => {
    setHeight(document.documentElement.clientHeight / 3);
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  useEffect(() => {
    setContainerClasses(
      clsx({
        "flex flex-col items-center justify-center z-40 cursor-pointer": true,
        "animate-scalebounce": hover == HoverState.HOVERING,
        "animate-unscalebounce": hover == HoverState.UNHOVERING,
      })
    );
  }, [hover]);

  useEffect(() => {
    setResumeClasses(
      clsx({
        "top-[-100dvh]": true,
        absolute: true,
        "h-[100dvh]": true,
        "w-screen": true,
        flex: true,
        "flex-col": true,
        "items-center": true,
        "justify-center": true,
        group: true,
        "z-50": true,
      })
    );
  }, [inView, active]);

  useEffect(() => {
    if (scroll) {
      scroll.on("scroll", (obj: any) => {
        const key = `resume-target`;
        if (key in obj.currentElements) {
          const diff =
            (2 * (obj.scroll.y - obj.currentElements[key].top)) /
            document.documentElement.clientHeight;
          setOffset0(Math.max(0, Math.min(1, diff * 5)));
          setOffset1(Math.max(0, Math.min(1, diff * 5 - 0.5)));
          setOffset2(Math.max(0, Math.min(1, diff * 5 - 1)));
          setOffset3(Math.max(0, Math.min(1, diff * 5 - 1.5)));
          setOffset4(Math.max(0, Math.min(1, diff * 5 - 2)));
          setOffset5(Math.max(0, Math.min(1, diff * 5 - 2.5)));
          setOffset6(Math.max(0, Math.min(1, diff * 5 - 3)));
          setOffset7(Math.max(0, Math.min(1, diff * 5 - 4.5)));
          setOffset8(Math.max(0, Math.min(1, diff * 5 - 5)));
          setOffsetText(Math.max(0, Math.min(1, diff)));
        }
      });
    }
  }, [scroll]);

  return (
    <>
      <div
        id="resume-target"
        className="absolute top-[-100dvh] h-[300dvh] w-full"
        data-scroll
        data-scroll-id="resume-target"
      />
      <div
        id="resume-sticky-target"
        className="absolute top-[-100dvh] h-[400dvh] w-full"
      />
      <div
        className="top-[-100dvh] absolute h-[300dvh] w-screen z-40 bg-blue-300 heavy-grain"
        data-scroll
        data-scroll-sticky
        data-scroll-target="#resume-sticky-target"
      >
        <NoSSR>
          <Squares
            count={100}
            theme={"dark"}
            index={`resume-squares`}
            color={"#93c5fd"}
            minWidth={2}
            maxWidth={5}
            minSpeed={20}
            maxSpeed={40}
            height={100}
            top={20}
          />
        </NoSSR>
      </div>
      <div className="absolute top-[calc(-100dvh-5rem)] w-screen z-50 overflow-hidden h-[100dvh]">
        <HeaderTitle id="resume" color={"transparent"} theme={"dark"}>
          Resume
        </HeaderTitle>
      </div>
      <div
        className={resumeClasses}
        data-scroll
        data-scroll-sticky
        data-scroll-target="#resume-sticky-target"
        data-scroll-id="resume-container"
      >
        <div
          className={containerClasses}
          onMouseEnter={() => {
            setHover(HoverState.HOVERING);
          }}
          onMouseLeave={() => {
            setHover(HoverState.UNHOVERING);
          }}
        >
          <svg
            width={height}
            height={height}
            viewBox="0 0 256 256"
            className="z-40"
          >
            <SVGStroke
              fill={offset0 >= 1 ? "#DCDFE1FF" : "#DCDFE100"}
              stroke="#DCDFE1"
              opacity={offset0}
              transitionDuration="1s"
              transitionProperty="fill"
              startStroke={0}
              strokeLength={offset0}
              svgPath={iconPathRef.current[0]}
              renderSVGPath={(pathCSS: React.CSSProperties) => {
                return (
                  <path
                    ref={(el) => {
                      iconPathRef.current[0] = el;
                    }}
                    d="M222.9,177.6V59c0-3.4-1.3-6.6-3.7-9L174.3,5.1c-2.4-2.4-5.6-3.7-9-3.7H45.6c-7,0-12.8,5.7-12.8,12.8v163.5h190Z"
                    style={pathCSS}
                  />
                );
              }}
            />
            <SVGStroke
              fill={offset1 >= 1 ? "#EA5440FF" : "#EA544000"}
              stroke="#EA5440"
              opacity={offset1}
              transitionDuration="1s"
              transitionProperty="fill"
              strokeWidth={1}
              startStroke={0}
              strokeLength={offset1}
              svgPath={iconPathRef.current[1]}
              renderSVGPath={(pathCSS: React.CSSProperties) => {
                return (
                  <path
                    ref={(el) => {
                      iconPathRef.current[1] = el;
                    }}
                    d="M32.9,177.6v63.9c0,7,5.7,12.8,12.8,12.8h164.4c7,0,12.8-5.7,12.8-12.8v-63.9H32.9Z"
                    style={pathCSS}
                  />
                );
              }}
            />
            <SVGStroke
              fill={offset2 >= 1 ? "#C4CBD2FF" : "#C4CBD200"}
              stroke="#C4CBD2"
              opacity={offset2}
              transitionDuration="1s"
              transitionProperty="fill"
              strokeWidth={1}
              startStroke={0}
              strokeLength={offset2}
              svgPath={iconPathRef.current[2]}
              renderSVGPath={(pathCSS: React.CSSProperties) => {
                return (
                  <path
                    ref={(el) => {
                      iconPathRef.current[2] = el;
                    }}
                    d="M170.8 53.1L222.9 105L222.6 56.8L170.8 53.1z"
                    style={pathCSS}
                  />
                );
              }}
            />
            <SVGStroke
              fill={offset3 >= 1 ? "#ABB2B8FF" : "#ABB2B800"}
              stroke="#ABB2B8"
              opacity={offset3}
              transitionDuration="1s"
              transitionProperty="fill"
              strokeWidth={1}
              startStroke={0}
              strokeLength={offset3}
              svgPath={iconPathRef.current[3]}
              renderSVGPath={(pathCSS: React.CSSProperties) => {
                return (
                  <path
                    ref={(el) => {
                      iconPathRef.current[3] = el;
                    }}
                    d="M219.1,50L174.3,5.1c-1.9-1.9-4.3-3.1-6.9-3.5v43.2c0,6.6,5.4,12,12,12h43.2c-.4-2.6-1.6-5-3.5-6.9Z"
                    style={pathCSS}
                  />
                );
              }}
            />
            <SVGStroke
              fill={offset4 >= 1 ? "#FFFFFFFF" : "#FFFFFF00"}
              stroke="#FFFFFF"
              opacity={offset4}
              transitionDuration="1s"
              transitionProperty="fill"
              strokeWidth={1}
              startStroke={0}
              strokeLength={offset4}
              svgPath={iconPathRef.current[4]}
              renderSVGPath={(pathCSS: React.CSSProperties) => {
                return (
                  <path
                    ref={(el) => {
                      iconPathRef.current[4] = el;
                    }}
                    d="M94.4,193.4h-12.3c-1.9,0-3.5,1.6-3.5,3.5v38.3c0,1.9,1.6,3.5,3.5,3.5s3.5-1.6,3.5-3.5v-12.1h8.8c6.3,0,11.5-5.2,11.5-11.5v-6.8c0-6.3-5.2-11.5-11.5-11.5ZM98.9,211.7c0,2.5-2,4.5-4.5,4.5h-8.8v-15.7h8.8c2.5,0,4.5,2,4.5,4.5v6.8Z"
                    style={pathCSS}
                  />
                );
              }}
            />
            <SVGStroke
              fill={offset5 >= 1 ? "#FFFFFFFF" : "#FFFFFF00"}
              stroke="#FFFFFF"
              opacity={offset5}
              transitionDuration="1s"
              transitionProperty="fill"
              strokeWidth={1}
              startStroke={0}
              strokeLength={offset5}
              svgPath={iconPathRef.current[5]}
              renderSVGPath={(pathCSS: React.CSSProperties) => {
                return (
                  <path
                    ref={(el) => {
                      iconPathRef.current[5] = el;
                    }}
                    d="M128.8,238.7h-11.5c-1.9,0-3.5-1.6-3.5-3.5v-38.3c0-1.9,1.6-3.5,3.5-3.5h11.5c6.8,0,12.3,5.5,12.3,12.3v20.7c0,6.8-5.5,12.3-12.3,12.3ZM120.9,231.7h8c2.9,0,5.3-2.4,5.3-5.3v-20.7c0-2.9-2.4-5.3-5.3-5.3h-8v31.3Z"
                    style={pathCSS}
                  />
                );
              }}
            />
            <SVGStroke
              fill={offset6 >= 1 ? "#FFFFFFFF" : "#FFFFFF00"}
              stroke="#FFFFFF"
              opacity={offset6}
              transitionDuration="1s"
              transitionProperty="fill"
              strokeWidth={1}
              startStroke={0}
              strokeLength={offset6}
              svgPath={iconPathRef.current[6]}
              renderSVGPath={(pathCSS: React.CSSProperties) => {
                return (
                  <path
                    ref={(el) => {
                      iconPathRef.current[6] = el;
                    }}
                    d="M173.6,193.4h-20.3c-1.9,0-3.5,1.6-3.5,3.5v38.3c0,1.9,1.6,3.5,3.5,3.5s3.5-1.6,3.5-3.5v-15.6h9.8c1.9,0,3.5-1.6,3.5-3.5s-1.6-3.5-3.5-3.5h-9.8v-12.1h16.8c1.9,0,3.5-1.6,3.5-3.5s-1.6-3.5-3.5-3.5Z"
                    style={pathCSS}
                  />
                );
              }}
            />
            <SVGStroke
              fill={offset7 >= 1 ? "#C4CBD2FF" : "#C4CBD200"}
              stroke="#C4CBD2"
              opacity={offset7}
              transitionDuration="1s"
              transitionProperty="fill"
              strokeWidth={1}
              startStroke={0}
              strokeLength={offset7}
              svgPath={iconPathRef.current[7]}
              renderSVGPath={(pathCSS: React.CSSProperties) => {
                return (
                  <path
                    ref={(el) => {
                      iconPathRef.current[7] = el;
                    }}
                    d="M170.4,113.8c-.4-1.1-1.5-1.7-2.6-1.7h-13.5v-33.1c0-1.6-1.3-2.8-2.8-2.8h-36c-1.6,0-2.8,1.3-2.8,2.8v33.1h-13.5c-1.1,0-2.2.7-2.6,1.7-.4,1.1-.2,2.3.6,3.1l34.3,34.3c.5.5,1.3.8,2,.8s1.4-.3,2-.8l34.3-34.3c.8-.8,1-2,.6-3.1Z"
                    style={pathCSS}
                  />
                );
              }}
            />
            <SVGStroke
              fill={offset8 >= 1 ? "#EA5440FF" : "#EA544000"}
              stroke="#EA5440"
              opacity={offset8}
              transitionDuration="1s"
              transitionProperty="fill"
              strokeWidth={1}
              startStroke={0}
              strokeLength={offset8}
              svgPath={iconPathRef.current[8]}
              renderSVGPath={(pathCSS: React.CSSProperties) => {
                return (
                  <path
                    ref={(el) => {
                      iconPathRef.current[8] = el;
                    }}
                    d="M164.8,108.2c-.4-1.1-1.5-1.7-2.6-1.7h-13.5v-33.1c0-1.6-1.3-2.8-2.8-2.8h-36c-1.6,0-2.8,1.3-2.8,2.8v33.1h-13.5c-1.1,0-2.2.7-2.6,1.7-.4,1.1-.2,2.3.6,3.1l34.3,34.3c.5.5,1.3.8,2,.8s1.4-.3,2-.8l34.3-34.3c.8-.8,1-2,.6-3.1Z"
                    style={pathCSS}
                  />
                );
              }}
            />
          </svg>
          {clickToDownloadText && clickToDownloadText.paths && (
            <svg
              width={clickToDownloadText.width}
              height={clickToDownloadText.height! + 10}
              viewBox={`0 0 ${clickToDownloadText.width} ${clickToDownloadText.height}`}
              className="z-40"
            >
              {clickToDownloadText.paths.map((path: string, index: number) => (
                <SVGStroke
                  key={`path${index}`}
                  fill="none"
                  stroke="#999999"
                  startStroke={0}
                  strokeLength={Math.min(
                    1,
                    offsetText * (clickToDownloadText.paths!.length / 3) -
                      index / 4
                  )}
                  svgPath={textPathRef.current[index]}
                  renderSVGPath={(pathCSS: React.CSSProperties) => {
                    return (
                      <path
                        ref={(el) => {
                          textPathRef.current[index] = el;
                        }}
                        d={path}
                        style={pathCSS}
                      />
                    );
                  }}
                />
              ))}
              <SVGStroke
                fill="none"
                stroke={"#999999"}
                strokeWidth={1}
                startStroke={0}
                strokeLength={offsetText}
                svgPath={lineRef.current}
                renderSVGPath={(pathCSS: React.CSSProperties) => {
                  return (
                    <path
                      ref={(el) => {
                        lineRef.current = el;
                      }}
                      d={
                        clickToDownloadText.width
                          ? `M 0 ${clickToDownloadText.height! + 5}L ${
                              clickToDownloadText.width
                            } ${clickToDownloadText.height! + 5}`
                          : ""
                      }
                      style={pathCSS}
                    />
                  );
                }}
              />
            </svg>
          )}
        </div>
      </div>
    </>
  );
}
