import {
  type EffectDetails,
  PlayState,
  PlayEvent,
  PLAY_DURATION,
} from "./homerenderpage";
import Markdown from "react-markdown";
import Image from "next/image";
import play from "@/../public/icons/play.svg";
import pause from "@/../public/icons/pause.svg";
import next from "@/../public/icons/next.svg";
import back from "@/../public/icons/back.svg";
import { useLayoutEffect, useState } from "react";
import clsx from "clsx";

interface FooterProps {
  effectIndex: number;
  previousEffectIndex: number | undefined;
  effects: Array<EffectDetails>;
  playState: PlayState;
  playEvent: PlayEvent;
  setText: React.Dispatch<React.SetStateAction<string>>;
  setPlayEvent: React.Dispatch<React.SetStateAction<PlayEvent>>;
  elapsedPlayDuration: number;
}

const progressClassesDefaults = {
  "h-full": true,
  "bg-gray-200": true,
  "ease-linear": true,
};

const controlClassesDefaults = {
  "w-3": true,
  "mr-2": true,
  "opacity-50": true,
  invert: true,
  "cursor-pointer": true,
};

export default function Footer({
  playState,
  playEvent,
  effects,
  previousEffectIndex,
  effectIndex,
  setText,
  setPlayEvent,
  elapsedPlayDuration,
}: FooterProps) {
  const [progressClasses, setProgressClasses] = useState(
    clsx(progressClassesDefaults)
  );
  const [targetWidth, setTargetWidth] = useState(0);
  const [playClasses, setPlayClasses] = useState("");
  const [pauseClasses, setPauseClasses] = useState("");
  const [pingPong, setPingPong] = useState(0);

  useLayoutEffect(() => {
    switch (playState) {
      case PlayState.PLAYING:
        if (playEvent == PlayEvent.PLAY) {
          setTargetWidth(100);

          setPlayClasses(
            clsx({
              ...controlClassesDefaults,
              hidden: true,
            })
          );
          setPauseClasses(
            clsx({
              ...controlClassesDefaults,
              hidden: false,
            })
          );
        } else if (playEvent == PlayEvent.DONE_PLAYING) {
          setPingPong((index) => index + 1);
        }
        break;
      case PlayState.PAUSING:
        break;
      case PlayState.PAUSED:
        if (playEvent == PlayEvent.PAUSE) {
          setPlayClasses(
            clsx({
              ...controlClassesDefaults,
              hidden: false,
            })
          );
          setPauseClasses(
            clsx({
              ...controlClassesDefaults,
              hidden: true,
            })
          );
        }
        break;
      case PlayState.DONE_PLAYING:
        if ([PlayEvent.PREVIOUS, PlayEvent.NEXT].includes(playEvent)) {
          if (playEvent == PlayEvent.NEXT) {
            setPingPong((index) => index + 1);
          } else if (playEvent == PlayEvent.PREVIOUS) {
            setPingPong((index) => index + 1);
          }
        } else {
          setTargetWidth(0);
        }

        break;
    }
    setProgressClasses(
      clsx({
        ...progressClassesDefaults,
        "transition-none": [
          PlayState.PAUSING,
          PlayState.PREPARING_TO_PLAY,
          PlayState.DONE_PLAYING,
        ].includes(playState),
        "transition-all": ![
          PlayState.PAUSING,
          PlayState.PREPARING_TO_PLAY,
          PlayState.DONE_PLAYING,
        ].includes(playState),
        "animate-pulse": playState == PlayState.PAUSED,
      })
    );
  }, [playState, playEvent]);

  useLayoutEffect(() => {
    setTargetWidth((100 * elapsedPlayDuration) / PLAY_DURATION);
  }, [elapsedPlayDuration]);

  return (
    <div
      data-scroll
      data-scroll-sticky
      data-scroll-target="#full"
      className="z-50 left-0 top-[100dvh] -mt-footer absolute h-footer w-full flex items-center justify-center will-change-transform delay-"
    >
      <div className="flex flex-row w-full bg-gray-200 h-full box-border p-2 shadow-lg shadow-gray-600 bg-opacity-10 backdrop-blur-md gap-[5dvw] items-center justify-stretch">
        <div className="flex flex-1 flex-col">
          <div className="text-xs relative overflow-hidden">
            {previousEffectIndex !== undefined && (
              <div
                className={`absolute fill-mode-forwards slide-out-to-bottom slide-in-from-top whitespace-pre ${
                  pingPong % 2 == 0 ? "animate-out" : "animate-in"
                }`}
              >
                {pingPong % 2 == 1
                  ? effects[effectIndex].name
                  : effects[previousEffectIndex].name}
              </div>
            )}
            <div
              className={`absolute fill-mode-forwards slide-out-to-bottom slide-in-from-top whitespace-pre ${
                pingPong % 2 == 1 ? "animate-out" : "animate-in"
              }`}
            >
              {pingPong % 2 == 0
                ? effects[effectIndex].name
                : effects[previousEffectIndex!].name}
            </div>
            &nbsp;
          </div>
          <div className="text-[0.6rem] relative overflow-hidden hidden md:block">
            {previousEffectIndex !== undefined && (
              <div
                className={`absolute fill-mode-forwards slide-out-to-bottom slide-in-from-top whitespace-pre ${
                  pingPong % 2 == 0 ? "animate-out" : "animate-in"
                }`}
              >
                <Markdown>
                  {pingPong % 2 == 1
                    ? effects[effectIndex].description
                    : effects[previousEffectIndex].description}
                </Markdown>
              </div>
            )}
            <div
              className={`absolute fill-mode-forwards slide-out-to-bottom slide-in-from-top whitespace-pre ${
                pingPong % 2 == 1 ? "animate-out" : "animate-in"
              }`}
            >
              <Markdown>
                {pingPong % 2 == 0
                  ? effects[effectIndex].description
                  : effects[previousEffectIndex!].description}
              </Markdown>
            </div>
            &nbsp; &nbsp;
          </div>
        </div>
        <div
          className={`flex flex-row flex-2 self-center justify-center items-center`}
        >
          <div className="flex">
            <Image
              className={clsx(controlClassesDefaults)}
              priority
              src={back}
              alt="Back"
              onClick={() => setPlayEvent(PlayEvent.PREVIOUS)}
            />
            <Image
              className={playClasses}
              priority
              src={play}
              onClick={() => setPlayEvent(PlayEvent.PLAY)}
              alt="Play"
            />
            <Image
              className={pauseClasses}
              priority
              src={pause}
              onClick={() => setPlayEvent(PlayEvent.PAUSE)}
              alt="Pause"
            />
            <Image
              className={clsx(controlClassesDefaults)}
              priority
              src={next}
              alt="Next"
              onClick={() => setPlayEvent(PlayEvent.NEXT)}
            />
          </div>
          <div className="flex min-w-[10rem] w-1/4">
            <div className="h-1 bg-gray-500 w-full">
              <div
                className={progressClasses}
                style={{
                  transitionDuration: `${
                    PLAY_DURATION - elapsedPlayDuration
                  }ms`,
                  width: `${targetWidth}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
        <div className="flex text-xs flex-1 justify-end">
          <input
            className="hidden bg-[rgba(0,0,0,0.1)] outline-none px-1 w-[9rem] sm:block"
            type="text"
            defaultValue=""
            maxLength={17}
            placeholder="[Custom Text]"
            onChange={(e) => {
              if (e.target.value == "") {
                if (document.documentElement.clientWidth < 640) {
                  setText("DR");
                } else {
                  setText("Donald Richardson".replaceAll(/ /g, "\u00A0"));
                }
              } else {
                setText(e.target.value.replaceAll(/ /g, "\u00A0"));
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
