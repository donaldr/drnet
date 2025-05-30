"use client";
import { WorkData } from "@/app/(default)/@work/workitems";
import {
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { useLocomotiveScroll } from "@/lib/locomotive";
import { EffectComposer } from "@react-three/postprocessing";
import { Canvas } from "@react-three/fiber";
import { Vector4 } from "three";
import { PixelPull, PixelSelectionMode, PullDirection } from "./pixelpull";
import { BlendScene } from "./blendscene";
import clsx from "clsx";
import { useDebounce } from "@/lib/customhooks";
import {
  decrementEventHandlerCount,
  incrementEventHandlerCount,
} from "@/lib/state";

export default function VideoPull({
  index,
  work,
  videoRef,
}: Readonly<{
  index: number;
  work: WorkData;
  videoRef: RefObject<HTMLVideoElement | null>;
}>) {
  const [offset, setOffset] = useState(0);
  const { scroll } = useLocomotiveScroll();
  const [pulse, setPulse] = useState(0);
  const [pull, setPull] = useState(false);
  const [pullClasses, setPullClasses] = useState("");
  const [screenDims, setScreenDims] = useState({ width: 0, height: 0 });
  const debouncer = useDebounce();

  useEffect(() => {
    if (scroll) {
      incrementEventHandlerCount("scroll-videopull");
      scroll.on("scroll", (obj: any) => {
        const key = `work-${index}-video-target`;
        if (key in obj.currentElements) {
          setOffset(
            Math.min(
              1,
              Math.max(
                0,
                (obj.scroll.y -
                  obj.currentElements[key].top -
                  document.documentElement.clientHeight * 0.5) /
                  (document.documentElement.clientHeight * 1.5)
              )
            )
          );
        }
      });
      scroll.on("call", (f: string, type: string) => {
        if (f == `work${index}VideoElementInView` && videoRef.current) {
          if (type == "enter") {
            setPull(false);
          } else {
            setPull(true);
            setPulse((x) => x + 1);
          }
        }
      });
    }
  }, [scroll, index, videoRef]);

  useEffect(() => {
    if (offset >= 1) {
      setPull(false);
    } else if (offset > 0) {
      setPull(true);
    } else if (offset == 0) {
      setPull(false);
    }
  }, [offset]);

  useLayoutEffect(() => {
    setPullClasses(
      clsx({
        "absolute top-[100dvh] z-50 w-screen h-[100dvh]": true,
        hidden: !pull,
      })
    );
  }, [pull]);

  const resize = useCallback(() => {
    debouncer(() => {
      setScreenDims({
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
      });
    });
  }, [debouncer]);

  useEffect(() => {
    resize();
    incrementEventHandlerCount("resize-videopull");
    window.addEventListener("resize", resize);
    return () => {
      decrementEventHandlerCount("resize-videopull");
      window.removeEventListener("resize", resize);
    };
  }, [resize]);

  const windowAspect = screenDims.width / screenDims.height;

  let frameCondition = true;
  if (videoRef.current) {
    frameCondition = windowAspect < work.videoAspect;
  }

  return (
    <div className={pullClasses}>
      {videoRef.current && (
        <Canvas
          orthographic
          flat
          linear
          className="w-full h-full"
          frameloop="demand"
        >
          <BlendScene
            from={videoRef.current!}
            toColor={new Vector4(0.09, 0.09, 0.09, 1.0)}
            t={0}
            pulse={pulse}
            width={screenDims.width}
            height={screenDims.height}
            frameWidth={
              (frameCondition
                ? 1
                : screenDims.width /
                  screenDims.height /
                  (videoRef.current.videoWidth /
                    videoRef.current.videoHeight)) *
              (work.needsPadding ? 1 / 0.8 : 1)
            }
            frameHeight={
              (frameCondition
                ? videoRef.current.videoWidth /
                  videoRef.current.videoHeight /
                  (screenDims.width / screenDims.height)
                : 1) * (work.needsPadding ? 1 / 0.8 : 1)
            }
          />
          <EffectComposer>
            <PixelPull
              t={offset}
              active={true}
              direction={PullDirection.UP}
              pullToBackground={true}
              backgroundColor={new Vector4(0.0, 0.0, 0.0, 0.0)}
              pixelSelectionMode={PixelSelectionMode.BRIGHT}
              pixelSelectionRandomBlend={0}
              noEnd={false}
            />
          </EffectComposer>
        </Canvas>
      )}
    </div>
  );
}
