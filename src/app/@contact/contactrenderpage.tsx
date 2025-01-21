"use client";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { useGlobalState } from "@/lib/state";
import HeaderTitle from "../headertitle";
import RotatingBackground from "./rotatingbackground";

export default function ContactRenderPage() {
  const [contactClasses, setContactClasses] = useState("opacity-0");
  const [activeName] = useGlobalState("active");
  const active = useMemo(() => {
    return activeName == "contact";
  }, [activeName]);
  const [inViews] = useGlobalState("inView");
  const inView = useMemo(() => {
    return inViews.includes("contact");
  }, [inViews]);

  useEffect(() => {
    setContactClasses(
      clsx({
        "top-[-200vh]": true,
        absolute: true,
        "h-screen": true,
        "w-screen": true,
      })
    );
  }, [inView, active]);

  return (
    <>
      <div className="h-screen"></div>
      <div
        id="contact-target"
        className="absolute top-[-200vh] h-[300vh] w-full"
        data-scroll
        data-scroll-id="contact-target"
      />
      <div className="absolute top-[calc(-100vh-5rem)] w-screen z-40 overflow-hidden h-[200vh] pointer-events-none">
        <HeaderTitle id="contact" color={"transparent"} theme={"dark"}>
          Contact
        </HeaderTitle>
      </div>
      <div
        className={contactClasses}
        data-scroll
        data-scroll-sticky
        data-scroll-target="#contact-target"
        data-scroll-id="contact-container"
      >
        <RotatingBackground active={active} />
      </div>
    </>
  );
}
