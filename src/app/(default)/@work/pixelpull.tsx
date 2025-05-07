"use client";
import { Vector4 } from "three";
import { PixelPullEffect } from "./pixelpulleffects";
import React, {
  Ref,
  forwardRef,
  useMemo,
  useLayoutEffect,
  useEffect,
} from "react";
import { useThree } from "@react-three/fiber";
export { PullDirection } from "./pixelpulleffects";

export enum PixelSelectionMode {
  BRIGHT = 0,
  DARK = 1,
  RED = 2,
  GREEN = 3,
  BLUE = 4,
}

export type PixelPullProps = ConstructorParameters<typeof PixelPullEffect>[0] &
  Partial<{
    active: boolean;
    t: number;
    direction: number;
    pullToBackground: boolean;
    backgroundColor: Vector4;
    pixelSelectionRandomBlend: number;
    pixelSelectionMode: number;
    minSpeed: number;
    maxSpeed: number;
    minLength: number;
    maxLength: number;
  }>;

export const PixelPull = forwardRef<PixelPullEffect, PixelPullProps>(
  function PixelPull(
    {
      active = false,
      direction = 0,
      pullToBackground = false,
      backgroundColor = new Vector4(0.0, 0.0, 0.0, 0.0),
      pixelSelectionRandomBlend = 0.5,
      pixelSelectionMode = PixelSelectionMode.BRIGHT,
      minSpeed = 4.0,
      maxSpeed = 8.0,
      minLength = 1.5,
      maxLength = 2.0,
      noEnd = false,
      ...props
    }: PixelPullProps,
    ref: Ref<PixelPullEffect>
  ) {
    const invalidate = useThree((state) => state.invalidate);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { t, texture, perturbationMap, dtSize, isActive } = props;
    const effect = useMemo(() => {
      return new PixelPullEffect();
    }, []);

    useLayoutEffect(() => {
      invalidate();
      if (props.t !== undefined) effect.t = props.t;
    }, [props.t, effect, invalidate]);

    useLayoutEffect(() => {
      invalidate();
      if (active !== undefined) effect.isActive = active;
    }, [active, effect, invalidate]);

    useLayoutEffect(() => {
      invalidate();
      if (direction !== undefined) effect.direction = direction;
    }, [direction, effect, invalidate]);

    useLayoutEffect(() => {
      invalidate();
      if (pullToBackground !== undefined)
        effect.pullToBackground = pullToBackground;
    }, [pullToBackground, effect, invalidate]);

    useLayoutEffect(() => {
      invalidate();
      if (backgroundColor !== undefined)
        effect.backgroundColor = backgroundColor;
    }, [backgroundColor, effect, invalidate]);

    useLayoutEffect(() => {
      invalidate();
      if (pixelSelectionMode !== undefined)
        effect.pixelSelectionMode = pixelSelectionMode;
    }, [pixelSelectionMode, effect, invalidate]);

    useLayoutEffect(() => {
      invalidate();
      if (pixelSelectionMode !== undefined)
        effect.pixelSelectionRandomBlend = pixelSelectionRandomBlend;
    }, [pixelSelectionMode, pixelSelectionRandomBlend, effect, invalidate]);

    useEffect(() => {
      return () => {
        effect.dispose = PixelPullEffect.prototype.dispose;
        effect.dispose();
      };
    }, [effect]);

    useLayoutEffect(() => {
      invalidate();
      if (minSpeed !== undefined) effect.minSpeed = minSpeed;
    }, [minSpeed, effect, invalidate]);

    useLayoutEffect(() => {
      invalidate();
      if (maxSpeed !== undefined) effect.maxSpeed = maxSpeed;
    }, [maxSpeed, effect, invalidate]);

    useLayoutEffect(() => {
      invalidate();
      if (minLength !== undefined) effect.minLength = minLength;
    }, [minLength, effect, invalidate]);

    useLayoutEffect(() => {
      invalidate();
      if (maxLength !== undefined) effect.maxLength = maxLength;
    }, [maxLength, effect, invalidate]);

    useLayoutEffect(() => {
      invalidate();
      if (noEnd !== undefined) effect.noEnd = noEnd;
    }, [noEnd, effect, invalidate]);

    return <primitive ref={ref} object={effect} dispose={null} />;
  }
);
