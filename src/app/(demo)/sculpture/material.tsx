"use client";

import { useRef, useState, useEffect, useMemo } from "react";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import fragmentShaderTemplate from "./sculpture.frag";
import vertexShader from "./sculpture.vert";

import { UiData, TemplateData, type Material } from "./ui";

import { Eta } from "eta";

const eta = new Eta({ autoEscape: false, useWith: true });

//const MAX_SHAPES = 10;
//const MAX_MATERIALS = 20;

const toFloat = (n: number) =>
  Number.isInteger(n) ? n.toFixed(1) : n.toFixed(4);

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
      showDebug: { value: false },
      showBoxes: { value: false },
      showBoundingBox: { value: false },
      debugMode: { value: 0 },
      mapScale: { value: 1.0 },
      maxRays: { value: 0 },
      marchingSteps: { value: 0 },
      distanceThreshold: { value: 0 },
      maxDistance: { value: 0 },
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
      boundingBoxPos: { value: new THREE.Vector3(0, 0, 0) },
      boundingBoxDims: { value: new THREE.Vector3(1, 1, 1) },
      shapePositions: { value: [] },
      shapeRotations: { value: [] },
      shapeIsRotated: { value: [] },
      materials: { value: [] },
      globalIllumination: { value: true },
      lighting: { value: true },
      shadows: { value: true },
      surfaceBlur: { value: true },
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
      const shapePositions = [...uiUniforms.shapes.map((s) => s.pos)];
      uniforms.shapePositions.value = shapePositions.map(
        (s) => new THREE.Vector3(s.x, s.y, s.z)
      );

      const shapeRotations = [
        ...uiUniforms.shapes.map(
          (s) =>
            new THREE.Matrix3().setFromMatrix4(
              new THREE.Matrix4()
                .makeRotationFromEuler(
                  new THREE.Euler(s.rot.x, s.rot.y, s.rot.z)
                )
                .invert()
            )
          //.toArray()
        ),
      ];
      /*
      if (shapeRotations.length < MAX_SHAPES) {
        for (let i = shapeRotations.length; i < MAX_SHAPES; i++) {
          shapeRotations.push([0, 0, 0, 0, 0, 0, 0, 0, 0]);
        }
      }
      */
      uniforms.shapeRotations.value = shapeRotations;

      uniforms.shapeIsRotated.value = uiUniforms.shapes.map(
        (s) => s.rot.x != 0 || s.rot.y != 0 || s.rot.z != 0
      );

      /*
      if (materials.length < MAX_MATERIALS) {
        for (let i = materials.length; i < MAX_MATERIALS; i++) {
          materials.push(materials[uiUniforms.materials.length - 1]);
        }
      }
      */

      const performanceSettings =
        uiUniforms.performanceSettings[uiUniforms.globals.perf];

      uniforms.materials.value = materials.map((material: Material) => ({
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
        kd: material.kd,
        ior: material.ior,
        reflectivity: performanceSettings.reflection
          ? Math.floor(material.reflectivity * 1000) / 1000
          : 0,
        intRef: material.intRef,
        roughness: material.roughness,
        reflectRoughness: material.reflectRoughness,
        refractRoughness: material.refractRoughness,
        surfaceBlur: material.surfaceBlur,
        metallic: material.metallic,
        transparency: performanceSettings.transparency
          ? Math.floor(material.transparency * 1000) / 1000
          : 0,
        attenuation: material.attenuation,
        attenuationStrength: material.attenuationStrength,
      }));
      uniforms.showDebug.value = uiUniforms.globals.showDebug;
      uniforms.debugMode.value = uiUniforms.globals.debugMode;
      uniforms.mapScale.value = uiUniforms.globals.mapScale;
      uniforms.showBoxes.value = uiUniforms.globals.showBoxes;
      uniforms.showBoundingBox.value = uiUniforms.globals.showBoundingBox;

      uniforms.maxRays.value = performanceSettings.maxRays;
      uniforms.marchingSteps.value = performanceSettings.marchingSteps;
      uniforms.distanceThreshold.value = performanceSettings.distanceThreshold;
      uniforms.maxDistance.value = performanceSettings.maxDistance;
      uniforms.giLength.value = performanceSettings.giLength;
      uniforms.giStrength.value = performanceSettings.giStrength;
      uniforms.aoStrength.value = performanceSettings.aoStrength;
      uniforms.shadowRange.value = performanceSettings.shadowRange;
      uniforms.shadowAccuracy.value = performanceSettings.shadowAccuracy;
      uniforms.roughReflectSamples.value =
        performanceSettings.roughReflectSamples;
      uniforms.roughRefractSamples.value =
        performanceSettings.roughRefractSamples;
      uniforms.camTgt.value = uiUniforms.globals.camTgt;
      uniforms.camHeight.value = uiUniforms.globals.camHeight;
      uniforms.camDist.value = uiUniforms.globals.camDist;
      uniforms.orbit.value = uiUniforms.globals.orbit;
      uniforms.boundingBoxPos.value = uiUniforms.globals.boundingBoxPos;
      uniforms.boundingBoxDims.value = uiUniforms.globals.boundingBoxDims;
      uniforms.globalIllumination.value =
        performanceSettings.globalIllumination;
      uniforms.lighting.value = performanceSettings.lighting;
      uniforms.shadows.value = performanceSettings.shadows;
      uniforms.surfaceBlur.value = performanceSettings.surfaceBlur;
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
