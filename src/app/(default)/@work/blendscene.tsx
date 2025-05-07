"use client";
import React, { useRef, useMemo, useLayoutEffect, useState } from "react";
import * as THREE from "three";
import glsl from "glslify";
import { useThree } from "@react-three/fiber";
import { useAspect } from "@react-three/drei";
import { Vector4 } from "three";

const vertexShader = glsl`
    precision mediump float;
    varying vec2 vUv;
    void main() {
        vUv = uv;
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;

        gl_Position = projectedPosition;
    }
`;

const fragmentShader = glsl`
    precision mediump float;
    uniform sampler2D videoTexture;
    uniform sampler2D toVideoTexture;
    uniform float t;
    uniform vec4 toColor;
    uniform float frameWidth;
    uniform float frameHeight;
    varying vec2 vUv;
    void main() {

        float mappedT = 0.0;
        if(t == 0.0) 
        {
            mappedT = 0.0;
        }
        else if(t == 1.0)
        {
            mappedT = 1.0;
        }
        else if(t < 0.5) 
        {
            mappedT = pow(2.0, 20.0 * t - 10.0) / 2.0;
        }
        else
        {
            mappedT = (2.0 - pow(2.0, -20.0 * t + 10.0)) / 2.0;
        }

        float newU = vUv.s * frameWidth - ((frameWidth - 1.0) / 2.0);
        float newV = vUv.t * frameHeight - ((frameHeight - 1.0) / 2.0);
        vec3 fromTexture = texture(videoTexture, vec2(newU, newV)).rgb;
        vec3 toTexture = texture(toVideoTexture, vec2(newU, newV)).rgb;
        toTexture = mix(toTexture, toColor.rgb, toColor.a);
        vec3 texture = mix(fromTexture, toTexture, vec3(mappedT));
        if(newU < 0.0 || newU > 1.0 || newV < 0.0 || newV > 1.0)
        {
            //gl_FragColor = vec4(vec3(0.0), 0.0);
            gl_FragColor = toColor;
        }
        else
        {
            gl_FragColor = vec4(texture, 1.0);
        }
    }
`;
function BlendMaterial(props: {
  from: HTMLVideoElement;
  to?: HTMLVideoElement;
  toColor?: Vector4;
  t: number;
  pulse?: number;
  frameWidth?: number;
  frameHeight?: number;
}) {
  const gl = useThree((state) => state.gl);
  const [videoTexture, setVideoTexture] = useState<THREE.Texture>();
  const [toVideoTexture, setToVideoTexture] = useState<THREE.Texture>();

  const {
    from,
    to,
    toColor,
    t,
    pulse,
    frameWidth = 1,
    frameHeight = 1,
  } = props;

  useLayoutEffect(() => {
    if (from) {
      const videoTexture = new THREE.Texture(from);
      videoTexture.generateMipmaps = false;
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      if ("colorSpace" in videoTexture)
        (videoTexture as any).colorSpace = (gl as any).outputColorSpace;
      else (videoTexture as any).encoding = gl.outputColorSpace;
      //@ts-expect-error Error says that isVideoTexture does not exist on type Texture but it does
      videoTexture.isVideoTexture = true;
      videoTexture.needsUpdate = true;
      //@ts-expect-error Error says that update does not exist on type Texture but it does
      videoTexture.update = () => {};
      setVideoTexture(videoTexture);
    }
  }, [gl, from]);

  useLayoutEffect(() => {
    if (to) {
      const toVideoTexture = new THREE.Texture(to);
      toVideoTexture.generateMipmaps = false;
      toVideoTexture.minFilter = THREE.LinearFilter;
      toVideoTexture.magFilter = THREE.LinearFilter;
      if ("colorSpace" in toVideoTexture)
        (toVideoTexture as any).colorSpace = (gl as any).outputColorSpace;
      else (toVideoTexture as any).encoding = gl.outputColorSpace;
      //@ts-expect-error Error says that isVideoTexture does not exist on type Texture but it does
      toVideoTexture.isVideoTexture = true;
      toVideoTexture.needsUpdate = true;
      //@ts-expect-error Error says that update does not exist on type Texture but it does
      toVideoTexture.update = () => {};
      setToVideoTexture(toVideoTexture);
    }
  }, [gl, to]);

  useLayoutEffect(() => {
    if (videoTexture) {
      videoTexture.needsUpdate = true;
    }
    if (toVideoTexture) {
      toVideoTexture.needsUpdate = true;
    }
  }, [pulse, videoTexture, toVideoTexture]);

  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      videoTexture: { type: "t", value: videoTexture },
      toVideoTexture: { type: "t", value: toVideoTexture },
      toColor: { value: new Vector4(0, 0, 0, 0) },
      t: { value: 0 },
      frameWidth: { value: frameWidth ? frameWidth : 1 },
      frameHeight: { value: frameHeight ? frameHeight : 1 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [videoTexture, toVideoTexture, frameWidth, frameHeight]
  );

  useLayoutEffect(() => {
    if (shaderRef.current && videoTexture) {
      shaderRef.current.uniforms.videoTexture.value = videoTexture;
      videoTexture.needsUpdate = true;
    }
  }, [videoTexture]);

  useLayoutEffect(() => {
    if (shaderRef.current && toVideoTexture) {
      shaderRef.current.uniforms.toVideoTexture.value = toVideoTexture;
      toVideoTexture.needsUpdate = true;
    }
  }, [toVideoTexture]);

  useLayoutEffect(() => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.t.value = t;
    }
  }, [t]);

  useLayoutEffect(() => {
    if (shaderRef.current && frameWidth) {
      shaderRef.current.uniforms.frameWidth.value = frameWidth;
    }
  }, [frameWidth]);

  useLayoutEffect(() => {
    if (shaderRef.current && frameHeight) {
      shaderRef.current.uniforms.frameHeight.value = frameHeight;
    }
  }, [frameHeight]);

  useLayoutEffect(() => {
    if (shaderRef.current && toColor) {
      shaderRef.current.uniforms.toColor.value = toColor;
    }
  }, [toColor]);

  return (
    <shaderMaterial
      ref={shaderRef}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
    />
  );
}

export function BlendScene(props: {
  from: HTMLVideoElement;
  to?: HTMLVideoElement;
  toColor?: Vector4;
  t: number;
  pulse?: number;
  width: number;
  height: number;
  frameWidth?: number;
  frameHeight?: number;
}) {
  const {
    from,
    to,
    toColor,
    t,
    pulse,
    width,
    height,
    frameWidth,
    frameHeight,
  } = props;

  const size = useAspect(
    width ? width : from ? from.videoWidth : 0,
    height ? height : from ? from.videoHeight : 0
  );

  return (
    <mesh scale={size}>
      <planeGeometry />
      <BlendMaterial
        from={from}
        to={to}
        t={t}
        pulse={pulse}
        {...(toColor && { toColor })}
        {...(frameWidth && { frameWidth })}
        {...(frameHeight && { frameHeight })}
      />
    </mesh>
  );
}
