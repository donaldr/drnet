"use client";
import { useEffect, useState } from "react";

import { invalidate, Canvas } from "@react-three/fiber";
import { EffectComposer, SMAA } from "@react-three/postprocessing";
import { RoughnessBlur } from "./roughnesspass";
import { OrthographicCamera } from "@react-three/drei";
import { ShaderMaterial } from "./material";
import NoSSR from "react-no-ssr";
import RaymarchingUI, { TemplateData, UiData } from "./ui";
import * as THREE from "three";
/*
import {
  PhysicsSimulator,
  ShapeDefinition,
  SimulationConfig,
} from "./scultpor";
 */

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
  const [templateVariables, setTemplateVariables] = useState<TemplateData>();
  const [surfaceBlur, setSurfaceBlur] = useState(true);
  const [showDebug, setShowDebug] = useState(true);

  // The shaders tend to be brittle and tend to break when we
  // change the window size or the underlying shader material.
  //
  // To force rerenders, we use a unique key for the canvas
  // that changes whenever the window size changes.
  useEffect(() => {
    setKey(`${innerWidth}-${innerHeight}`);
    invalidate();
  }, [innerWidth, innerHeight, key]);

  useEffect(() => {
    if (uiUniforms !== undefined) {
      setSurfaceBlur(
        uiUniforms?.performanceSettings[uiUniforms.globals.perf].surfaceBlur
      );
      setShowDebug(uiUniforms?.globals.showDebug);
    }
  }, [uiUniforms]);

  /*
  useEffect(() => {
    // Initialize the simulator
    if(templateVariables)
    {
      const config: SimulationConfig = {
          shapes: templateVariables.shapes.map((shape, index) => ({
            id: index,
            type: shape.type,
            dimensions: shape.dimensions,
          } as ShapeDefinition)),
          radius: 1,
          gravityStrength: 3,
          friction: 1.5,
          verticalSpread: 0.25 * numberOfShapes,
          simulationSpeed: 10, 
          stepsPerIteration: 10,
      };
      const simulatorInstance = new PhysicsSimulator({
      });
    }
  }, [templateVariables]);
  */

  return (
    <div className="bg-gray-100 w-full h-screen pr-[24rem] overflow-hidden">
      <div className="fixed top-0 right-0 h-screen w-[24rem] bg-gray-100 border-l border-gray-300 shadow-lg overflow-y-auto p-4">
        <RaymarchingUI
          setUniforms={setUniforms}
          setTemplateVariables={setTemplateVariables}
        />
      </div>
      <div className="pt-12 w-full flex justify-center h-full">
        <div className="w-[640px] flex flex-col h-full">
          <div className="h-[360px]">
            <NoSSR>
              <Canvas
                id="canvas"
                style={{
                  width: 640,
                  height: 360,
                  border: "1px solid #CCC",
                  boxShadow: "0 0 10px #CCC",
                }}
                camera={{ position: [0, 0, 1] }}
                key={key}
                gl={{
                  antialias: false, // Disable default antialias as we're using FXAA
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
                    <RoughnessBlur blurRadius={15} normalSensitivity={10} />
                  ) : (
                    <></>
                  )}
                </EffectComposer>
              </Canvas>
            </NoSSR>
          </div>
        </div>
      </div>
    </div>
  );
}
