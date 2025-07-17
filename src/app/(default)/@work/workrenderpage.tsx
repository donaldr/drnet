"use client";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  Profiler,
} from "react";
import clsx from "clsx";
import { WorkData } from "@/app/(default)/@work/workitems";
import Title from "./title";
import Hero from "./hero";
import HeaderTitle from "../headertitle";
import { useLocomotiveScroll } from "@/lib/locomotive";
import { SplitText } from "@rigo-m/react-split-text";
import Description from "./description";
import Video from "./video";
import VideoPull from "./videopull";
import Detail from "./detail";
import Slides from "./slides";
import {
  decrementEventHandlerCount,
  incrementEventHandlerCount,
  useGlobalState,
} from "@/lib/state";
import WorkOutro from "./workoutro";
import Squares from "../squares";
import NoSSR from "react-no-ssr";
import { useProfilerRender } from "@/lib/customhooks";

export default function WorkComponent({
  work,
  index,
}: Readonly<{
  work: WorkData;
  index: number;
}>) {
  const [workClasses, setWorkClasses] = useState("opacity-0");
  const [heroClasses, setHeroClasses] = useState("opacity-0");
  const [titleClasses, setTitleClasses] = useState("");
  const desc = useMemo(() => {
    return Array.isArray(work.description)
      ? work.description
      : [work.description];
  }, [work]);
  const [descriptionState, setDescriptionState] = useState<Array<string>>(
    Array(desc.length).fill("exit")
  );
  const descriptionStateRef = useRef(descriptionState);
  const [showTitle, setShowTitle] = useState(false);
  const { scroll } = useLocomotiveScroll();
  const [title2ShowBackground, setTitle2ShowBackground] = useState(false);
  const [videoInView, setVideoInView] = useState(false);
  const [activeName] = useGlobalState("active");
  const active = useMemo(() => {
    return activeName == `work-${index}`;
  }, [activeName, index]);
  const [inViews] = useGlobalState("inView");
  const inView = useMemo(() => {
    return inViews.includes(`work-${index}`);
  }, [inViews, index]);
  const activeRef = useRef(false);
  const [inColor, setInColor] = useState(false);
  const setImageSrcCallbackRef = useRef(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  //const { stop, wait } = useWaitWheel();
  const [size, setSize] = useState<[number, number] | undefined>();
  const profilerRender = useProfilerRender({ minDuration: 10 });

  useLayoutEffect(() => {
    function updateSize() {
      setSize([
        document.documentElement.clientWidth,
        document.documentElement.clientHeight,
      ]);
    }
    incrementEventHandlerCount("resize-workrender");
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => {
      decrementEventHandlerCount("resize-workrender");
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    setWorkClasses(
      clsx({
        "h-full w-screen transition-[opacity] duration-1000 will-change-[opacity] pt-[50dvh] bg-[var(--dark)]":
          true,
      })
    );
    setHeroClasses(
      clsx({
        "absolute top-[-100dvh] z-40 h-[100dvh] w-full pointer-events-none will-change-transform":
          true,
      })
    );
    if (active) {
      document.documentElement.style.setProperty(
        "--title-outline-color",
        work.theme == "light" ? "#66666633" : "#99999966"
      );
    }
  }, [inView, active, index, work]);

  useEffect(() => {
    if (scroll) {
      scroll.on("call", (f: string, type: string) => {
        if (f == `work${index}TitleInView`) {
          setShowTitle(type == "enter");
        }
        if (f == `work${index}VideoElementInView`) {
          setVideoInView(type == "enter");
        }
      });
      incrementEventHandlerCount("scroll-workrender");
      scroll.on("scroll", (obj: any) => {
        if (activeRef.current) {
          const videoContainerKey = `work-${index}-video-container`;
          const videoPullContainerKey = `work-${index}-video-pull-container`;
          const workThemeChangeTargetKey = `work-${index}-theme-change-target`;
          if (
            workThemeChangeTargetKey in obj.currentElements &&
            work.theme == "light"
          ) {
            setInColor(true);
          } else {
            setInColor(false);
          }
          if (videoContainerKey in obj.currentElements) {
            if (obj.currentElements[videoContainerKey].progress > 0.5) {
              obj.currentElements[videoContainerKey].speed = -1;
              if (videoPullContainerKey in obj.currentElements) {
                obj.currentElements[videoPullContainerKey].speed = -1;
              }
            } else {
              obj.currentElements[videoContainerKey].speed = -0.5;
              if (videoPullContainerKey in obj.currentElements) {
                obj.currentElements[videoPullContainerKey].speed = -0.5;
              }
            }
          }
          const title2Key = `work-${index}-title-target-2`;
          setTitle2ShowBackground(title2Key in obj.currentElements);

          const descriptionElKeys = Object.keys(obj.currentElements).filter(
            (el: string) => el.match(/^work-\d+-description-(\d)$/)
          );

          descriptionElKeys.forEach((descriptionElKey) => {
            const el = obj.currentElements[descriptionElKey];
            const i = el.el.id.match(/work-\d+-description-(\d)/)[1];
            const progress = el.progress * descriptionElKeys.length - i;
            if (progress > 0.1 && progress < 0.9) {
              if (descriptionStateRef.current[i] == "exit") {
                /*
                stop();
                //scroll.scrollTo(el.el);
                setTimeout(() => {
                  wait();
                }, 500);
                */
                setDescriptionState((old) => {
                  const newDesc = [...old];
                  newDesc[i] = "enter";
                  return newDesc;
                });
              }
            } else if (descriptionStateRef.current[i] == "enter") {
              setDescriptionState((old) => {
                const newDesc = [...old];
                newDesc[i] = "exit";
                return newDesc;
              });
            }
          });

          descriptionStateRef.current
            .map((el, index) => [index, el])
            .filter((el) => el[1] == "enter")
            .forEach((entered) => {
              const i = entered[0] as number;
              const elName = `work-${index}-description-${i}`;
              if (!(elName in obj.currentElements)) {
                setDescriptionState((old) => {
                  const newDesc = [...old];
                  newDesc[i] = "exit";
                  return newDesc;
                });
              }
            });
        }
      });
    }
  }, [scroll, index, work]);

  useEffect(() => {
    descriptionStateRef.current = descriptionState;
  }, [descriptionState]);

  useEffect(() => {
    setTitleClasses(
      clsx({
        "group pt-header px-[5dvw] fixed left-0 top-0": true,
        hidden: !showTitle,
        active: inView,
        "not-active": !inView,
      })
    );
  }, [showTitle, inView]);

  useLayoutEffect(() => {
    if (inColor) {
      document.documentElement.style.setProperty("--foreground", "var(--dark");
    } else {
      document.documentElement.style.setProperty("--foreground", "var(--light");
    }
  }, [inColor]);

  const revealTitle = useMemo(
    () => (
      //@ts-expect-error SplitText doesn't take children, but it does
      <SplitText
        LetterWrapper={({ children }: any) => {
          return <span className={`inline-block`}>{children}</span>;
        }}
      >
        {work.project}
      </SplitText>
    ),
    [work]
  );

  return (
    <>
      <Profiler id={`work-${index}`} onRender={profilerRender}>
        <div
          id={`work-${index}-title-target`}
          className="absolute top-[50dvh] h-[200dvh] mt-[-100dvh]"
          data-scroll
          data-scroll-repeat
          data-scroll-call={`work${index}TitleInView`}
          data-scroll-id={`work-${index}-title-target`}
        ></div>
        <div
          id={`work-${index}-title-target-2`}
          className="absolute h-[300dvh] mt-[-100dvh]"
          data-scroll
          data-scroll-repeat
          data-scroll-id={`work-${index}-title-target-2`}
          style={{
            top: `${150 + desc.length * 100 + 250}dvh`,
          }}
        ></div>
        <div
          id={`work-${index}-video-play`}
          className="absolute w-screen h-[50dvh]"
          data-scroll
          data-scroll-repeat
          data-scroll-call={`work${index}VideoElementInView`}
          style={{
            top: `${150 + desc.length * 100}dvh`,
          }}
        ></div>
        <div
          id={`work-${index}-video-target`}
          className="absolute w-screen h-[300dvh]"
          data-scroll
          data-scroll-repeat
          data-scroll-id={`work-${index}-video-target`}
          style={{
            top: `${150 + desc.length * 100}dvh`,
          }}
        ></div>
        <div
          id={`work-${index}-theme-change-target`}
          className="absolute w-screen"
          data-scroll
          data-scroll-repeat
          data-scroll-id={`work-${index}-theme-change-target`}
          style={{
            top: `150dvh`,
            height: `${desc.length * 100}dvh`,
          }}
        ></div>
        <div
          id={`work-${index}-detail-target`}
          className="absolute w-screen h-[150dvh]"
          data-scroll
          data-scroll-repeat
          data-scroll-id={`work-${index}-detail-target`}
          style={{
            top: `${150 + desc.length * 100 + 200}dvh`,
          }}
        ></div>
        <div
          id={`work-${index}-slides-target`}
          className="absolute w-screen h-[400dvh]"
          data-scroll
          data-scroll-repeat
          data-scroll-id={`work-${index}-slides-target`}
          style={{
            top: `${150 + desc.length * 100 + 100}dvh`,
          }}
        ></div>
        <div
          id={`work-${index}-slides-in-view-target`}
          className="absolute w-screen h-[100dvh]"
          data-scroll
          data-scroll-repeat
          data-scroll-id={`work-${index}-slides-in-view-target`}
          data-scroll-call={`work${index}ShowSlides`}
          style={{
            top: `${150 + desc.length * 100 + 450}dvh`,
          }}
        ></div>
        <div
          id={`work-${index}-hero-target`}
          className="absolute h-[150dvh] top-[-100dvh]"
          data-scroll
          data-scroll-repeat
          data-scroll-id={`work-${index}-hero-target`}
        ></div>
        <div
          id={`work-${index}-hero-show-target`}
          className="absolute h-[300dvh] top-[-100dvh]"
          data-scroll
          data-scroll-repeat
          data-scroll-id={`work-${index}-hero-show-target`}
        ></div>
        <div
          id={`work-${index}-outro-target`}
          className="absolute w-screen h-[500dvh]"
          data-scroll
          data-scroll-repeat
          data-scroll-id={`work-${index}-outro-target`}
          style={{
            top: `${150 + desc.length * 100 + 100}dvh`,
          }}
        ></div>
        <div
          id={`work-${index}-outro-animate`}
          className="absolute w-screen h-[100dvh]"
          data-scroll
          data-scroll-repeat
          data-scroll-id={`work-${index}-outro-animate`}
          style={{
            top: `${150 + desc.length * 100 + 500}dvh`,
          }}
        ></div>
        <div
          className={workClasses}
          data-scroll
          data-scroll-repeat
          style={{
            height: `${100 + desc.length * 100 + 550}dvh`,
          }}
        >
          <div
            data-scroll
            data-scroll-sticky
            data-scroll-target={`#work-${index}-hero-target`}
            className={heroClasses}
            data-scroll-repeat
            data-scroll-id={`work-${index}-hero-container`}
            data-scroll-speed={10}
          >
            <Profiler id={`hero-${index}`} onRender={profilerRender}>
              <Hero work={work} index={index!} />
            </Profiler>
          </div>
          <div
            data-scroll
            data-scroll-sticky
            data-scroll-target="#full"
            className="fixed top-0 z-40 h-[100dvh] w-full pointer-events-none will-change-transform"
            data-scroll-repeat
            data-scroll-id={`work-${index}-title-container`}
          >
            <div className={titleClasses}>
              <Profiler id={`title-${index}`} onRender={profilerRender}>
                <NoSSR>
                  <Title
                    theme={work.theme || "dark"}
                    titleOutline={!!work.titleOutline}
                    color={work.primaryColor}
                  >
                    {work.project}
                  </Title>
                </NoSSR>
              </Profiler>
            </div>
          </div>
          <div
            className="absolute top-[50dvh] w-screen z-50 overflow-hidden light-grain"
            style={{
              backgroundColor: work.primaryColor,
              height: `${100 + 100 * desc.length}dvh`,
            }}
          >
            <Profiler id={`header-title-${index}`} onRender={profilerRender}>
              <HeaderTitle
                id={`work-${index!.toString()}-1`}
                color={work.primaryColor}
                theme={work.theme || "dark"}
                activeRef={activeRef}
                work={work}
              >
                {work.project}
              </HeaderTitle>
            </Profiler>
            <div
              id={`work-${index}-reveal-title`}
              className="absolute top-[-100dvh] z-[45] w-full h-[100dvh] will-change-transform"
              data-scroll
              data-scroll-sticky
              data-scroll-target={`#work-${index}-title-target`}
              data-scroll-repeat
            >
              <h1
                className="px-[5dvw] block pt-4 mt-header leading-[1.2]"
                style={{
                  fontVariationSettings: `"wdth" 100 "wght" 600`,
                  color: work.theme == "light" ? "var(--dark)" : "var(--light)",
                  opacity: work.theme == "light" ? 0.9 : 1,
                }}
              >
                {revealTitle}
              </h1>
            </div>
            <div
              id={`description-${index}-target`}
              className="relative w-screen text-lg sm:text-2xl mt-[4rem]"
              style={{
                height: `calc(${100 + desc.length * 100}dvh - 7rem)`,
              }}
            >
              <Profiler id={`squares-${index}`} onRender={profilerRender}>
                <NoSSR>
                  <Squares
                    count={20}
                    theme={work.theme}
                    index={`work-${index}`}
                    color={work.primaryColor}
                    minWidth={5}
                    maxWidth={15}
                    minSpeed={0}
                    maxSpeed={20}
                    height={100 * desc.length}
                    top={0}
                  />
                </NoSSR>
              </Profiler>
              <NoSSR>
                {desc.map((d, i) => (
                  <div
                    id={`work-${index}-description-${i}`}
                    key={`work-${index}-description-${i}`}
                    className="absolute px-[20%] top-0 left-0 w-screen h-[100dvh] will-change-transform"
                    data-scroll
                    data-scroll-repeat
                    data-scroll-sticky
                    data-scroll-target={`#description-${index}-target`}
                    data-scroll-id={`work-${index}-description-${i}`}
                  >
                    <div
                      id={`work-${index}-description-${i}-container`}
                      className={`relative group h-[100dvh] flex items-center justify-center`}
                      data-scroll
                      data-scroll-repeat
                      //data-scroll-offset={`${100 * (i + 1)}%,${50 - 100 * i}%`}
                      //data-scroll-call={`work${index}DescriptionInView`}
                      data-scroll-id={`work-${index}-description-${i}-container`}
                    >
                      <div className={`group/action ${descriptionState[i]}`}>
                        <Profiler
                          id={`description-${index}`}
                          onRender={profilerRender}
                        >
                          <Description theme={work.theme || "dark"}>
                            {d}
                          </Description>
                        </Profiler>
                      </div>
                    </div>
                  </div>
                ))}
              </NoSSR>
            </div>
          </div>
          {work.video && (
            <div
              className="absolute h-[300dvh] box-content w-screen z-40"
              data-scroll
              data-scroll-repeat
              data-scroll-speed={-5}
              data-scroll-id={`work-${index}-video-container`}
              style={{
                top: `${50 + desc.length * 100}dvh`,
              }}
            >
              <Profiler id={`video-${index}`} onRender={profilerRender}>
                <Video work={work} index={index!} videoRef={videoRef} />
              </Profiler>
            </div>
          )}
          {
            //@ts-expect-error undefined
            false && work.video && size && size[0] > 640 && (
              <div
                className="absolute h-[300dvh] box-content w-screen z-40 pointer-events-none"
                data-scroll
                data-scroll-repeat
                data-scroll-speed={-5}
                data-scroll-id={`work-${index}-video-pull-container`}
                style={{
                  top: `${50 + desc.length * 100}dvh`,
                }}
              >
                <Profiler id={`video-pull-${index}`} onRender={profilerRender}>
                  <VideoPull work={work} index={index!} videoRef={videoRef} />
                </Profiler>
              </div>
            )
          }
          <div
            className="absolute w-screen z-[51] overflow-hidden pointer-events-none"
            style={{
              height: "150dvh",
              top: `${150 + desc.length * 100 + 195}dvh`,
            }}
          >
            <Profiler id={`header-title-2-${index}`} onRender={profilerRender}>
              <HeaderTitle
                id={`work-${index!.toString()}-2`}
                color="transparent"
                theme={work.theme || "dark"}
                setImageSrcCallbackRef={setImageSrcCallbackRef}
                showBackground={title2ShowBackground}
                activeRef={activeRef}
                work={work}
              >
                {work.project}
              </HeaderTitle>
            </Profiler>
          </div>
          <Profiler id={`detail-and-slides-${index}`} onRender={profilerRender}>
            <NoSSR>
              <Detail
                work={work}
                index={index!}
                top={`${150 + desc.length * 100 + 200}dvh`}
                videoInView={videoInView}
              />
            </NoSSR>
            <div
              data-scroll
              data-scroll-sticky
              data-scroll-target={`#work-${index}-slides-target`}
              className={clsx({
                "absolute h-[100dvh] w-screen bg-[var(--dark)] will-change-transform z-30":
                  true,
                "pointer-events-none": videoInView,
              })}
              style={{
                top: `${150 + desc.length * 100 + 100}dvh`,
              }}
            >
              <Profiler id={`slides-${index}`} onRender={profilerRender}>
                <NoSSR>
                  <Slides
                    work={work}
                    index={index!}
                    setImageSrcCallbackRef={setImageSrcCallbackRef}
                  />
                </NoSSR>
              </Profiler>
            </div>
          </Profiler>
          <div
            data-scroll
            data-scroll-sticky
            data-scroll-target={`#work-${index}-outro-target`}
            className={clsx({
              "absolute h-[100dvh] w-screen bg-[var(--dark)] will-change-transform":
                true,
              "pointer-events-none": videoInView,
            })}
            style={{
              top: `${150 + desc.length * 100 + 100}dvh`,
            }}
          >
            <Profiler id={`outro-${index}`} onRender={profilerRender}>
              <WorkOutro index={index} />
            </Profiler>
          </div>
        </div>
      </Profiler>
    </>
  );
}
