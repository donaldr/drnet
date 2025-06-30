"use client";
import { useCallback, useEffect, useRef, useState } from "react";

import { invalidate, Canvas } from "@react-three/fiber";
import { EffectComposer, SMAA } from "@react-three/postprocessing";
import { RoughnessBlur } from "./roughnesspass";
import { OrthographicCamera } from "@react-three/drei";
import { ShaderMaterial } from "./material";
import NoSSR from "react-no-ssr";
import RaymarchingUI from "./ui";
import { TemplateData, UiData } from "./datamanager";
import * as THREE from "three";
import RetroSlider from "./retroslider";
import { v4 as uuidv4 } from "uuid";
import { useThrottle } from "@/lib/customhooks";

function useWindowSize() {
  const [size, setSize] = useState({ innerWidth: 400, innerHeight: 400 });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
      });
    };

    const debouncedHandleResize = debounce(handleResize, 250);
    window.addEventListener("resize", debouncedHandleResize);
    return () => window.removeEventListener("resize", debouncedHandleResize);
  }, []);

  return size;
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export default function ShaderCanvas() {
  const { innerWidth, innerHeight } = useWindowSize();
  const [key, setKey] = useState(`${innerWidth}-${innerHeight}`);
  const [uiUniforms, setUniforms] = useState<UiData>();
  const [shapesUpdated, setShapesUpdated] = useState(0);
  const [materialsUpdated, setMaterialsUpdated] = useState(0);
  const [performanceSettingsUpdated, setPerformanceSettingsUpdated] =
    useState(0);
  const [perfUpdated, setPerfUpdate] = useState(0);
  const [globalsUpdated, setGlobalsUpdated] = useState(0);
  const [templateVariables, setTemplateVariables] = useState<TemplateData>();
  const [surfaceBlur, setSurfaceBlur] = useState(true);
  const [showDebug, setShowDebug] = useState(true);
  const raf = useRef<string | null>(null);
  const currentOrbit = useRef(0);
  const throttler = useThrottle();
  const [sliderChanged, setSliderChanged] = useState(false);

  // The shaders tend to be brittle and tend to break when we
  // change the window size or the underlying shader material.
  //
  // To force rerenders, we use a unique key for the canvas
  // that changes whenever the window size changes.
  useEffect(() => {
    setKey(`${innerWidth}-${innerHeight}`);
    invalidate();
  }, [innerWidth, innerHeight, key]);

  const easeOrbit = useCallback(
    (time: number, delta: number, uuid: string | null, orbit: number) => {
      if (
        (Math.abs(orbit) <= 0.01 &&
          Math.abs(currentOrbit.current - orbit) < 0.01) ||
        uuid !== raf.current
      ) {
        if (
          Math.abs(orbit) <= 0.01 &&
          Math.abs(currentOrbit.current - orbit) < 0.01
        ) {
          currentOrbit.current = 0;
          setUniforms((prevState?: UiData) => {
            return {
              ...prevState,
              globals: {
                ...prevState?.globals,
                camHAngle:
                  prevState!.globals.camHAngle +
                  currentOrbit.current * (delta / 1000),
              },
            } as UiData;
          });
          setGlobalsUpdated((prev) => prev + 1);
          raf.current = null;
        }
      } else {
        currentOrbit.current = orbit * 0.1 + 0.9 * currentOrbit.current;
        setUniforms((prevState?: UiData) => {
          return {
            ...prevState,
            globals: {
              ...prevState?.globals,
              camHAngle:
                prevState!.globals.camHAngle +
                currentOrbit.current * (delta / 1000),
            },
          } as UiData;
        });
        setGlobalsUpdated((prev) => prev + 1);
        requestAnimationFrame((newTime: number) => {
          easeOrbit(newTime, newTime - time, uuid, orbit);
        });
      }
    },
    []
  );

  useEffect(() => {
    if (uiUniforms !== undefined) {
      setSurfaceBlur(
        uiUniforms?.performanceSettings[uiUniforms.globals.perf].surfaceBlur
      );
      setShowDebug(uiUniforms?.globals.showDebug);
    }
  }, [uiUniforms]);

  useEffect(() => {
    requestAnimationFrame((time) => {
      raf.current = uuidv4();
      easeOrbit(time, 1000 / 60, raf.current, 0.2);
    });
  }, [easeOrbit]);

  return (
    <div className="bg-gray-100 w-full h-screen pr-[24rem] overflow-hidden">
      <div className="fixed top-0 right-0 h-screen w-[24rem] bg-gray-100 border-l border-gray-300 shadow-lg overflow-y-auto p-4">
        <RaymarchingUI
          setUniforms={setUniforms}
          setTemplateVariables={setTemplateVariables}
          setGlobalsUpdated={setGlobalsUpdated}
          setMaterialsUpdated={setMaterialsUpdated}
          setPerfUpdated={setPerfUpdate}
          setPerformanceSettingsUpdated={setPerformanceSettingsUpdated}
          setShapesUpdated={setShapesUpdated}
        />
      </div>
      <div className="w-full flex justify-center items-center h-full -mt-4">
        <div className="flex flex-col">
          <div className="flex flex-row w-[640px] text-[9px] uppercase text-gray-400 tracking-widest underline underline-offset-2 justify-around self-center mb-2">
            <div
              className="cursor-pointer"
              onClick={() => {
                if (setUniforms) {
                  setUniforms((prevState?: UiData) => {
                    return {
                      ...prevState,
                      globals: {
                        ...prevState?.globals,
                        camHAngle: 0.0,
                        camVAngle: 1.3,
                        camDist: 0.9,
                      },
                    } as UiData;
                  });
                  setGlobalsUpdated((prev) => prev + 1);
                }
              }}
            >
              View 1
            </div>
            <div
              className="cursor-pointer"
              onClick={() => {
                if (setUniforms) {
                  setUniforms((prevState?: UiData) => {
                    return {
                      ...prevState,
                      globals: {
                        ...prevState?.globals,
                        camHAngle: 2.1,
                        camVAngle: 1.3,
                        camDist: 1.2,
                      },
                    } as UiData;
                  });
                  setGlobalsUpdated((prev) => prev + 1);
                }
              }}
            >
              View 2
            </div>
            <div
              className="cursor-pointer"
              onClick={() => {
                if (setUniforms) {
                  setUniforms((prevState?: UiData) => {
                    return {
                      ...prevState,
                      globals: {
                        ...prevState?.globals,
                        camHAngle: 4.2,
                        camVAngle: 1.0,
                        camDist: 0.7,
                      },
                    } as UiData;
                  });
                  setGlobalsUpdated((prev) => prev + 1);
                }
              }}
            >
              View 3
            </div>
            <div
              className="cursor-pointer"
              onClick={() => {
                if (setUniforms) {
                  setUniforms((prevState?: UiData) => {
                    return {
                      ...prevState,
                      globals: {
                        ...prevState?.globals,
                        camHAngle: -0.5,
                        camVAngle: 0.5,
                        camDist: 0.8,
                      },
                    } as UiData;
                  });
                  setGlobalsUpdated((prev) => prev + 1);
                }
              }}
            >
              View 4
            </div>
          </div>
          <div className="flex flex-row h-[360px]">
            <RetroSlider
              orientation="vertical"
              className="px-0"
              snapToCenter={false}
              homePosition={25}
              value={
                uiUniforms
                  ? ((uiUniforms.globals.camVAngle - 1.67) / 1.62) * -100 - 25
                  : 0
              }
              onPositionChange={(position) => {
                setUniforms((prevState?: UiData) => {
                  return {
                    ...prevState,
                    globals: {
                      ...prevState?.globals,
                      camVAngle: 1.67 - ((position + 25) / 100) * 1.62,
                    },
                  } as UiData;
                });
                setGlobalsUpdated((prev) => prev + 1);
              }}
            />
            <div className="w-[640px] flex flex-col h-full">
              <div className="h-[360px] relative">
                <div className="w-[640px] h-[360px] bg-gray-200 left-0 top-0 z-20 border-[1px] border-gray-200 shadow-[0_0_10px_#CCC] flex justify-center items-center text-gray-400 uppercase text-xs">
                  <NoSSR>
                    <Canvas
                      id="canvas"
                      className="border-[1px] border-gray-300 shadow-[0_0_10px_#CCC]"
                      style={{
                        width: 640,
                        height: 360,
                      }}
                      camera={{ position: [0, 0, 1] }}
                      //key={key}
                      gl={{
                        antialias: false, // Disable default antialias as we're using SMAA
                      }}
                      onCreated={async (state) => {
                        const { gl, scene, camera } = state;
                        await gl.compileAsync(scene, camera); // Compiles all materials
                      }}
                    >
                      <OrthographicCamera
                        makeDefault
                        left={-1}
                        right={1}
                        top={1}
                        bottom={-1}
                        near={0.1}
                        far={1000}
                        position={[0, 0, 1]}
                      />
                      <mesh scale={[2, 2, 1]}>
                        <planeGeometry />
                        {uiUniforms && templateVariables && (
                          <ShaderMaterial
                            uiUniforms={uiUniforms}
                            shapesUpdated={shapesUpdated}
                            materialsUpdated={materialsUpdated}
                            perfUpdated={perfUpdated}
                            performanceSettingsUpdated={
                              performanceSettingsUpdated
                            }
                            globalsUpdated={globalsUpdated}
                            templateVariables={templateVariables}
                          />
                        )}
                      </mesh>
                      <EffectComposer
                        multisampling={0}
                        frameBufferType={THREE.FloatType}
                      >
                        <SMAA />
                        {surfaceBlur && !showDebug ? (
                          <RoughnessBlur
                            blurRadius={15}
                            normalSensitivity={10}
                          />
                        ) : (
                          <></>
                        )}
                      </EffectComposer>
                    </Canvas>
                  </NoSSR>
                </div>
                <div className="relative">
                  <RetroSlider
                    className="py-0 px-0"
                    value={sliderChanged ? undefined : 10}
                    onPositionChange={(position) => {
                      setSliderChanged(true);
                      requestAnimationFrame((time: number) => {
                        if (position == 0) {
                          raf.current = uuidv4();
                          easeOrbit(
                            time,
                            1000 / 60,
                            raf.current,
                            position / 50
                          );
                        } else {
                          throttler(() => {
                            raf.current = uuidv4();
                            easeOrbit(
                              time,
                              1000 / 60,
                              raf.current,
                              position / 50
                            );
                          }, 100);
                        }
                      });
                    }}
                    snapToCenter={false}
                  />
                </div>
              </div>
            </div>
            <RetroSlider
              orientation="vertical"
              className="px-0"
              snapToCenter={false}
              value={
                uiUniforms
                  ? ((uiUniforms.globals.camDist - 0.5) / 0.8) * 100 - 50
                  : 0
              }
              onPositionChange={(position) => {
                setUniforms((prevState?: UiData) => {
                  return {
                    ...prevState,
                    globals: {
                      ...prevState?.globals,
                      camDist: 0.5 + ((position + 50) / 100) * 0.8,
                    },
                  } as UiData;
                });
                setGlobalsUpdated((prev) => prev + 1);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
