"use client";
import React, { createContext, RefObject, useRef } from "react";
import { LocomotiveScrollProvider } from "react-locomotive-scroll";
import { WaitWheelProvider } from "../lib/customhooks";
import ScrollDown from "./scrolldown";

export const ScrollContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

export default function Content({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ref = useRef<HTMLDivElement | null>(null);

  return (
    <LocomotiveScrollProvider
      options={{
        repeat: true,
        smooth: true,
        lerp: 0.1,
        getDirection: true,
        multiplier: 0.5,
        smartphone: {
          smooth: true,
        },
        tablet: {
          smooth: true,
        },
      }}
      watch={
        [
          //..all the dependencies you want to watch to update the scroll.
          //  Basicaly, you would want to watch page/location changes
          //  For exemple, on Next.js you would want to watch properties like `router.asPath` (you may want to add more criterias if the instance should be update on locations with query parameters)
        ]
      }
      containerRef={ref}
    >
      <WaitWheelProvider>
        <div data-scroll-container className="h-full">
          <div id="full" ref={ref} className="h-full">
            {children}
          </div>
        </div>
        <ScrollDown />
      </WaitWheelProvider>
    </LocomotiveScrollProvider>
  );
}
