"use client";

import { useRef, useState, useEffect, useMemo } from "react";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import fragmentShaderTemplate from "./addie.frag";
import vertexShader from "./addie.vert";

import {
  Shape,
  InterfaceMode,
  UiData,
  TemplateData,
  type Material,
} from "./ui";

import { Eta } from "eta";

const eta = new Eta({ autoEscape: false, useWith: true });

const MAX_SHAPES = 10;
const MAX_MATERIALS = 20;

const toFloat = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n));

export function ShaderMaterial({
  uiUniforms,
  templateVariables,
}: Readonly<{
  uiUniforms: UiData;
  templateVariables: TemplateData;
}>) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [fragmentShader, setFragmentShader] = useState("");
  const [compileTime, setCompileTime] = useState(0);
  const dpr = window.devicePixelRatio;

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Convert mouse position to Shadertoy's coordinate system
      // (pixels from bottom-left)
      const canvas = document.getElementById("canvas");
      const rect = canvas?.getBoundingClientRect();
      if (
        event.buttons &&
        event.clientX < 640 * dpr &&
        event.clientY < 360 * dpr
      ) {
        setMouse({
          x: (event.clientX - rect!.left) * dpr,
          y: (event.clientY - rect!.top) * dpr,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [dpr]);

  const uniforms = useMemo(
    () => ({
      iTime: { value: 0.0 },
      iTimeDelta: { value: 0.0 },
      iFrame: { value: 0 },
      iResolution: { value: new THREE.Vector2(1, 1) },
      iMouse: { value: new THREE.Vector3(0, 0, 1) },
      showPerformance: { value: false },
      showBoxes: { value: false },
      perfMode: { value: 0 },
      perfScale: { value: 1.0 },
      numberOfShapes: { value: 0 },
      numberOfMaterials: { value: 0 },
      numberOfLights: { value: 0 },
      maxRays: { value: 0 },
      marchingSteps: { value: 0 },
      distanceThreshold: { value: 0 },
      giLength: { value: 0 },
      giStrength: { value: 0 },
      aoStrength: { value: 0 },
      shadowRange: { value: 0 },
      shadowAccuracy: { value: 0 },
      roughReflectSamples: { value: 0 },
      roughRefractSamples: { value: 0 },
      camTgt: { value: new THREE.Vector3(0, 0, 0) },
      camHeight: { value: 0 },
      camDist: { value: 0 },
      orbit: { value: 0 },
      shapes: { value: [] },
      materials: { value: [] },
      globalIllumination: { value: true },
      lighting: { value: true },
      shadows: { value: true },
    }),
    []
  );

  useEffect(() => {
    const t = eta.renderString(fragmentShaderTemplate, {
      ...templateVariables,
      _f: toFloat,
    });
    setFragmentShader(t);
  }, [templateVariables]);

  useEffect(() => {
    if (materialRef.current) {
      const { uniforms } = materialRef.current;
      const materials = [...uiUniforms.materials];
      if (uiUniforms.globals.mode == InterfaceMode.DEVELOPMENT) {
        const shapes = [...uiUniforms.shapes];
        if (shapes.length < MAX_SHAPES) {
          for (let i = shapes.length; i < MAX_SHAPES; i++) {
            shapes.push(shapes[uiUniforms.shapes.length - 1]);
          }
        }

        uniforms.shapes.value = shapes.map((shape: Shape) => ({
          type: shape.type,
          id: shape.id,
          l: shape.l,
          c: shape.c,
          a: shape.a,
          b: shape.b,
          n: shape.n,
          pos: shape.pos,
          h: shape.h,
          r: shape.r,
          r1: shape.r1,
          r2: shape.r2,
          mat: shape.mat,
          rot: new THREE.Matrix3()
            .setFromMatrix4(
              new THREE.Matrix4()
                .makeRotationFromEuler(
                  new THREE.Euler(
                    (shape.rot.x / 180) * Math.PI,
                    (shape.rot.y / 180) * Math.PI,
                    (shape.rot.z / 180) * Math.PI
                  )
                )
                .invert()
            )
            .toArray(),
          isRot: shape.rot.x != 0 || shape.rot.y != 0 || shape.rot.z != 0,
        }));
      } else {
        uniforms.shapes.value = uiUniforms.shapes.map(
          (s) => new THREE.Vector3(s.pos.x, s.pos.y, s.pos.z)
        );
      }
      if (materials.length < MAX_MATERIALS) {
        for (let i = materials.length; i < MAX_MATERIALS; i++) {
          materials.push(materials[uiUniforms.materials.length - 1]);
        }
      }

      uniforms.materials.value = materials.map((material: Material) => ({
        emissive: material.emissive,
        color: {
          x: material.color.r,
          y: material.color.g,
          z: material.color.b,
        },
        innerColor: {
          x: material.innerColor.r,
          y: material.innerColor.g,
          z: material.innerColor.b,
        },
        glowColor: {
          x: material.glowColor.r,
          y: material.glowColor.g,
          z: material.glowColor.b,
        },
        kd: material.kd,
        ior: material.ior,
        reflectivity: uiUniforms.globals.reflection
          ? Math.floor(material.reflectivity * 1000) / 1000
          : 0,
        intRef: material.intRef,
        roughness: material.roughness,
        reflectRoughness:
          uiUniforms.globals.perf == "LOW" ? 0.0 : material.reflectRoughness,
        refractRoughness:
          uiUniforms.globals.perf == "LOW" ? 0.0 : material.refractRoughness,
        metallic: material.metallic,
        transparency: uiUniforms.globals.transparency
          ? Math.floor(material.transparency * 1000) / 1000
          : 0,
        attenuation: material.attenuation,
        attenuationStrength: material.attenuationStrength,
        glow: material.glow,
      }));
      uniforms.showPerformance.value = uiUniforms.globals.showPerformance;
      uniforms.perfMode.value = uiUniforms.globals.perfMode;
      uniforms.perfScale.value = uiUniforms.globals.perfScale;
      uniforms.showBoxes.value = uiUniforms.globals.showBoxes;
      uniforms.numberOfShapes.value = uiUniforms.globals.numberOfShapes;
      uniforms.numberOfMaterials.value = uiUniforms.globals.numberOfMaterials;
      uniforms.numberOfLights.value = uiUniforms.globals.numberOfLights;

      const maxRays =
        uiUniforms.globals.perf == "LOW"
          ? 5
          : uiUniforms.globals.perf == "MEDIUM"
          ? 10
          : 40;
      uniforms.maxRays.value = Math.min(uiUniforms.globals.maxRays, maxRays);
      uniforms.marchingSteps.value = uiUniforms.globals.marchingSteps;
      uniforms.distanceThreshold.value = uiUniforms.globals.distanceThreshold;
      uniforms.giLength.value = uiUniforms.globals.giLength;
      uniforms.giStrength.value = uiUniforms.globals.giStrength;
      uniforms.aoStrength.value = uiUniforms.globals.aoStrength;
      uniforms.shadowRange.value = uiUniforms.globals.shadowRange;
      uniforms.shadowAccuracy.value = uiUniforms.globals.shadowAccuracy;
      uniforms.roughReflectSamples.value =
        uiUniforms.globals.roughReflectSamples;
      uniforms.roughRefractSamples.value =
        uiUniforms.globals.roughRefractSamples;
      uniforms.camTgt.value = uiUniforms.globals.camTgt;
      uniforms.camHeight.value = uiUniforms.globals.camHeight;
      uniforms.camDist.value = uiUniforms.globals.camDist;
      uniforms.orbit.value = uiUniforms.globals.orbit;
      uniforms.globalIllumination.value = uiUniforms.globals.globalIllumination;
      uniforms.lighting.value = uiUniforms.globals.lighting;
      uniforms.shadows.value = uiUniforms.globals.shadows;
    }
  }, [uiUniforms]);

  useFrame((state) => {
    if (materialRef.current) {
      const { uniforms } = materialRef.current;
      const { elapsedTime } = state.clock;

      uniforms.iTimeDelta.value = elapsedTime - uniforms.iTime.value;
      uniforms.iTime.value = elapsedTime;
      uniforms.iResolution.value.set(640 * dpr, 360 * dpr, 1);
      uniforms.iMouse.value.set(mouse.x, mouse.y, 1);
      uniforms.iFrame.value = uniforms.iFrame.value + 1;
      setCompileTime((prevTime) => {
        if (prevTime == 0) return elapsedTime;
        return prevTime;
      });
    }
  });

  useEffect(() => {
    if (compileTime != 0) {
      console.log(compileTime);
    }
  }, [compileTime]);

  return (
    <>
      {
        <shaderMaterial
          ref={materialRef as React.RefObject<THREE.ShaderMaterial>}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={false}
          opacity={1}
          key={fragmentShader.toString()}
        />
      }
    </>
  );
}
