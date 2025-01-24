"use client";
import {
  useRef,
  useEffect,
  useState,
  ReactNode,
  useLayoutEffect,
  useMemo,
  useCallback,
} from "react";
import clsx from "clsx";
import FitVariable from "@/app/@home/fit";
import Chop from "@/app/@home/chop";
import React from "react";
import Footer from "./footer";
import { useLocomotiveScroll } from "react-locomotive-scroll";
import { useGlobalState, navigating } from "../../lib/state";
import { useWaitWheel } from "../../lib/customhooks";

export type Effect = ({
  show,
  children,
}: Readonly<{ show: boolean; children: ReactNode }>) => ReactNode;

export interface EffectDetails {
  name: string;
  description: string;
  effect: Effect;
}

export const enum PlayEvent {
  NULL = "null",
  PLAY = "play",
  NEXT = "next",
  PREVIOUS = "previous",
  DONE_PLAYING = "donePlaying",
  PAUSE = "pause",
  STOP = "stop",
}

export const enum PlayState {
  INITIAL = "initial",
  PREPARING_TO_PLAY = "preparingToPlay",
  PLAYING = "playing",
  DONE_PLAYING = "donePlaying",
  PAUSING = "pausing",
  PAUSED = "paused",
}

export const PLAY_DURATION = 30000;

const enum TouchOrWheel {
  INIT = "init",
  TOUCH = "touch",
  WHEEL = "wheel",
}

const effects: Array<EffectDetails> = [
  {
    name: "Fit Lighting",
    description:
      "[Fit Variable Font](https://fonts.adobe.com/fonts/fit-variable), CSS Faux Lighting, Mouse Reactive",
    effect: FitVariable,
  },
  {
    name: "Chop",
    description: "Physics Engine, CSS Masks, Interactive",
    effect: Chop,
  },
];

export default function HomeRenderPage() {
  const [homeClasses, setHomeClasses] = useState("opacity-0");
  const [homeContentClasses, setHomeContentClasses] = useState("");
  const [playState, setPlayState] = useState<PlayState>(PlayState.INITIAL);
  const [playEvent, setPlayEvent] = useState<PlayEvent>(PlayEvent.PLAY);
  const [elapsedPlayDuration, setElapsedPlayDuration] = useState(0);
  const elapsedPlayDurationRef = useRef(elapsedPlayDuration);
  const startTimeRef = useRef(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [effectIndex, setEffectIndex] = useState(0);
  const [previousEffectIndex, setPreviousEffectIndex] = useState<number>();
  const lastEffectTimeRef = useRef(0);
  const { scroll } = useLocomotiveScroll();
  const [activeName] = useGlobalState("active");
  const active = useMemo(() => {
    return activeName == "home";
  }, [activeName]);
  const activeRef = useRef(active);
  const { stop, wait, readyRef } = useWaitWheel();
  const [touchOrWheel, setTouchOrWheel] = useState(TouchOrWheel.INIT);
  const touchOrMoveRef = useRef(touchOrWheel);
  const homeExitRef = useRef(false);
  const [size, setSize] = useState<[number, number] | undefined>();

  useLayoutEffect(() => {
    if (playEvent == PlayEvent.STOP) {
      setPlayState(PlayState.INITIAL);
    }
    switch (playState) {
      case PlayState.INITIAL:
        if (playEvent == PlayEvent.PLAY) {
          setPlayState(PlayState.PREPARING_TO_PLAY);
        }
        break;
      case PlayState.PREPARING_TO_PLAY:
        lastEffectTimeRef.current = Date.now();
        if (playEvent == PlayEvent.PLAY) {
          setPlayState(PlayState.PLAYING);
        } else if (playEvent == PlayEvent.DONE_PLAYING) {
          setTimeout(() => {
            setPlayEvent(PlayEvent.PLAY);
          }, 10);
        }
        break;
      case PlayState.PLAYING:
        if (playEvent == PlayEvent.PLAY) {
          startTimeRef.current = Date.now();

          timeoutRef.current = setTimeout(() => {
            setPlayEvent(PlayEvent.DONE_PLAYING);
          }, PLAY_DURATION - elapsedPlayDurationRef.current);
        } else if (playEvent == PlayEvent.DONE_PLAYING) {
          setEffectIndex((previousIndex) => {
            setPreviousEffectIndex(previousIndex);
            return (previousIndex + 1) % effects.length;
          });
          setPlayState(PlayState.DONE_PLAYING);
        } else if (playEvent == PlayEvent.PAUSE) {
          setPlayState(PlayState.PAUSING);
        } else if (playEvent == PlayEvent.NEXT) {
          if (Date.now() > lastEffectTimeRef.current + 1200) {
            setPlayState(PlayState.DONE_PLAYING);
            clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
            setEffectIndex((previousIndex) => {
              setPreviousEffectIndex(previousIndex);
              return (previousIndex + 1) % effects.length;
            });
          } else {
            setPlayEvent(PlayEvent.NULL);
          }
        } else if (playEvent == PlayEvent.PREVIOUS) {
          if (Date.now() > lastEffectTimeRef.current + 1200) {
            setPlayState(PlayState.DONE_PLAYING);
            clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
            setEffectIndex((previousIndex) => {
              setPreviousEffectIndex(previousIndex);
              return (effects.length + (previousIndex - 1)) % effects.length;
            });
          } else {
            setPlayEvent(PlayEvent.NULL);
          }
        }
        break;
      case PlayState.PAUSING:
        if (playEvent == PlayEvent.PAUSE) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = undefined;
          setPlayState(PlayState.PAUSED);
        }
        break;
      case PlayState.PAUSED:
        if (playEvent == PlayEvent.PAUSE) {
          setElapsedPlayDuration((oldElapsed) => {
            const newElapsed = oldElapsed + (Date.now() - startTimeRef.current);
            elapsedPlayDurationRef.current = newElapsed;
            return newElapsed;
          });
        } else if (playEvent == PlayEvent.PLAY) {
          setPlayState(PlayState.PREPARING_TO_PLAY);
        } else if (playEvent == PlayEvent.NEXT) {
          if (Date.now() > lastEffectTimeRef.current + 1200) {
            setPlayState(PlayState.DONE_PLAYING);
            clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
            setEffectIndex((previousIndex) => {
              setPreviousEffectIndex(previousIndex);
              return (previousIndex + 1) % effects.length;
            });
          } else {
            setPlayEvent(PlayEvent.NULL);
          }
        } else if (playEvent == PlayEvent.PREVIOUS) {
          if (Date.now() > lastEffectTimeRef.current + 1200) {
            setPlayState(PlayState.DONE_PLAYING);
            clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
            setEffectIndex((previousIndex) => {
              setPreviousEffectIndex(previousIndex);
              return (effects.length + (previousIndex - 1)) % effects.length;
            });
          } else {
            setPlayEvent(PlayEvent.NULL);
          }
        }
        break;
      case PlayState.DONE_PLAYING:
        if ([PlayEvent.PREVIOUS, PlayEvent.NEXT].includes(playEvent)) {
          setPlayEvent(PlayEvent.DONE_PLAYING);
        } else {
          setElapsedPlayDuration(0);
          elapsedPlayDurationRef.current = 0;
          setPlayState(PlayState.PREPARING_TO_PLAY);
        }
        break;
    }
  }, [playState, playEvent]);

  const touchmove = useCallback(() => {
    setTouchOrWheel(TouchOrWheel.TOUCH);
  }, []);

  const wheel = useCallback(() => {
    setTouchOrWheel(TouchOrWheel.WHEEL);
  }, []);

  useEffect(() => {
    touchOrMoveRef.current = touchOrWheel;
  }, [touchOrWheel]);

  useEffect(() => {
    document.addEventListener("touchmove", touchmove);
    document.addEventListener("wheel", wheel);

    return () => {
      document.removeEventListener("touchmove", touchmove);
      document.removeEventListener("wheel", wheel);
    };
  }, [touchmove, wheel]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useLayoutEffect(() => {
    setHomeClasses(
      clsx({
        "h-[100vh] transition-[opacity] duration-500 will-change-[opacity,transform]":
          true,
      })
    );
    setHomeContentClasses(
      clsx({
        "fixed top-0 left-0 h-[100vh] w-full": true,
      })
    );
  }, []);

  const resize = useCallback(() => {
    setSize([
      document.documentElement.clientWidth,
      document.documentElement.clientHeight,
    ]);
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  useEffect(() => {
    if (scroll) {
      scroll.on("scroll", (obj: any) => {
        if (
          activeRef.current &&
          !navigating.current &&
          obj.scroll.y > 0 &&
          readyRef.current
        ) {
          if (obj.direction == "down") {
            if (
              obj.scroll.y < document.documentElement.clientHeight &&
              touchOrMoveRef.current == TouchOrWheel.WHEEL
            ) {
              stop();
              scroll.scrollTo("#work", {
                callback: () => {
                  wait();
                },
                offset: -document.documentElement.clientHeight,
                duration: 500,
                disableLerp: true,
              });
            }
            if (touchOrMoveRef.current == TouchOrWheel.TOUCH) {
              if (
                "work-intro-content" in obj.currentElements &&
                !("home-content" in obj.currentElements)
              ) {
                if (homeExitRef.current == false) {
                  stop();
                  scroll.scrollTo("#work", {
                    callback: () => {
                      wait();
                    },
                    offset: -document.documentElement.clientHeight,
                    duration: 50,
                    disableLerp: true,
                  });
                  homeExitRef.current = true;
                }
              } else {
                homeExitRef.current = false;
              }
            }
          } else {
            /*
            stop();
            scroll.scrollTo("#home", {
              callback: () => {
                wait();
              },
              duration: 500,
              disableLerp: true
            });
            */
          }
        }
      });
    }
  }, [scroll, readyRef, wait, stop]);

  const [text, setText] = useState("Donald\u00A0Richardson");

  useEffect(() => {
    if (size) {
      if (size[0] < 640) {
        setText("DR");
      } else {
        setText("Donald\u00A0Richardson");
      }
    }
  }, [size]);

  return (
    <>
      <div
        className={homeClasses}
        data-scroll
        data-scroll-repeat
        data-scroll-id="home-target"
      >
        <div
          id="home-sticky"
          data-scroll
          data-scroll-sticky
          data-scroll-target="#full"
          className={homeContentClasses}
          data-scroll-repeat
          data-scroll-id="home-sticky"
        >
          {effects.map((effect, index) =>
            React.createElement(
              effect.effect,
              index == effectIndex
                ? {
                    show: active,
                    children: text,
                    key: index,
                  }
                : {
                    show: false,
                    children: text,
                    key: index,
                  }
            )
          )}
        </div>
        <Footer
          effectIndex={effectIndex}
          previousEffectIndex={previousEffectIndex}
          effects={effects}
          playEvent={playEvent}
          playState={playState}
          setText={setText}
          setPlayEvent={setPlayEvent}
          elapsedPlayDuration={elapsedPlayDuration}
        />
      </div>
    </>
  );
}
