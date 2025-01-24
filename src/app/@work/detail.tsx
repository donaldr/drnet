"use client";
import { WorkData } from "@/app/@work/workitems";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useTemplateFunction } from "@/lib/customhooks";
import interpolateComponents from "@automattic/interpolate-components";
import DetailItem from "./detailitem";
import { useLocomotiveScroll } from "react-locomotive-scroll";
import DetailRoles from "./detailroles";

function Detail({
  index,
  work,
  top,
  videoInView,
}: Readonly<{
  index: number;
  work: WorkData;
  top: string;
  videoInView: boolean;
}>) {
  const [reveal, setReveal] = useState(true);
  const [clientReveal, setClientReveal] = useState(false);
  const [projectReveal, setProjectReveal] = useState(false);
  const [dateReveal, setDateReveal] = useState(false);
  const [positionReveal, setPositionReveal] = useState(false);
  const [employerReveal, setEmployerReveal] = useState(false);
  const [size, setSize] = useState<[number, number] | undefined>();
  const sizeRef = useRef(size);

  const { scroll } = useLocomotiveScroll();

  useEffect(() => {
    if (scroll) {
      scroll.on("scroll", (obj: any) => {
        const key = `work-${index}-detail-target-1`;
        if (key in obj.currentElements) {
          const el = obj.currentElements[key];
          if (
            (el.progress > 0.28 &&
              el.progress < 0.6 &&
              obj.direction == "down") ||
            (el.progress > 0.4 && el.progress < 0.7 && obj.direction == "up")
          ) {
            setReveal(true);
          } else if (
            (el.progress < 0.4 && obj.direction == "up") ||
            (el.progress > 0.6 && obj.direction == "down")
          ) {
            setReveal(false);
          }
          if (
            (el.progress > 0.281 &&
              el.progress < 0.599 &&
              obj.direction == "down") ||
            (el.progress > 0.401 &&
              el.progress < 0.699 &&
              obj.direction == "up")
          ) {
            setClientReveal(true);
            setDateReveal(true);
            setPositionReveal(true);
            setProjectReveal(true);
            setEmployerReveal(true);
          } else if (
            (el.progress < 0.401 && obj.direction == "up") ||
            (el.progress > 0.599 && obj.direction == "down")
          ) {
            setClientReveal(false);
            setDateReveal(false);
            setPositionReveal(false);
            setProjectReveal(false);
            setEmployerReveal(false);
          }
        }
      });
    }
  }, [scroll, index]);

  const resize = useCallback(() => {
    setSize([
      document.documentElement.clientWidth,
      document.documentElement.clientHeight,
    ]);
  }, []);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  useEffect(() => {
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const templateFnGenerator = useTemplateFunction(work.detailTemplate);

  const detailItem = useMemo(() => {
    const templateFn = templateFnGenerator();

    const workProps = {
      project: `{{DetailItemProject}}${work.project}{{/DetailItemProject}}`,
      client: `{{DetailItemClient}}${work.client}{{/DetailItemClient}}`,
      date: `{{DetailItemDate}}${work.date}{{/DetailItemDate}}`,
      position: `{{DetailItemPosition}}${work.position}{{/DetailItemPosition}}`,
      employer: `{{DetailItemEmployer}}${work.employer}{{/DetailItemEmployer}}`,
    };
    const result = templateFn(workProps);

    return interpolateComponents({
      mixedString: result,
      components: {
        DetailItemProject: (
          <DetailItem
            label="project"
            color={work.primaryColor}
            groupUnderlineRevealClass="group-[.project-reveal]:left-0"
            groupRevealClass="group-[.project-reveal]:top-0"
          />
        ),
        DetailItemClient: (
          <DetailItem
            label="client"
            color={work.primaryColor}
            groupUnderlineRevealClass="group-[.client-reveal]:left-0"
            groupRevealClass="group-[.client-reveal]:top-0"
          />
        ),
        DetailItemDate: (
          <DetailItem
            label="date"
            color={work.primaryColor}
            groupUnderlineRevealClass="group-[.date-reveal]:left-0"
            groupRevealClass="group-[.date-reveal]:top-0"
          />
        ),
        DetailItemPosition: (
          <DetailItem
            label="position"
            color={work.primaryColor}
            groupUnderlineRevealClass="group-[.position-reveal]:left-0"
            groupRevealClass="group-[.position-reveal]:top-0"
          />
        ),
        DetailItemEmployer: (
          <DetailItem
            label="employer"
            color={work.primaryColor}
            groupUnderlineRevealClass="group-[.employer-reveal]:left-0"
            groupRevealClass="group-[.employer-reveal]:top-0"
          />
        ),
      },
    });
  }, [templateFnGenerator, work]);

  return (
    <>
      <div
        className={clsx({
          "group absolute px-[5vw] md:text-xl lg:text-2xl h-[100vh] w-[50vw] z-50 box-border will-change-transform max-w-[64rem] md:flex items-center justify-center leading-loose transition-[opacity] duration-1000 hidden":
            true,
          "pointer-events-none": videoInView,
          "md:opacity-100": reveal,
          "md:opacity-0": !reveal,
          "client-reveal": clientReveal,
          "project-reveal": projectReveal,
          "date-reveal": dateReveal,
          "position-reveal": positionReveal,
          "employer-reveal": employerReveal,
          active: reveal,
          "not-active": !reveal,
        })}
        data-scroll
        data-scroll-repeat
        data-scroll-id={`work-${index}-detail-main`}
        data-scroll-sticky
        data-scroll-target={`#work-${index}-detail-target-1`}
        data-scroll-speed={1}
        style={{
          top: top,
          transitionDelay: reveal ? `0ms` : `750ms`,
        }}
      >
        <div className="leading-[1.75]">{detailItem}</div>
      </div>
      <div
        //id={`work-${index}-detail-roles`}
        className={clsx({
          "group absolute px-[5vw] text-xl h-[150vh] w-full md:w-[50vw] z-50 box-border md:left-[min(50vw,64rem)] will-change-transform max-w-[64rem] flex flex-col items-center justify-center":
            true,
          "pointer-events-none": videoInView,
          "client-reveal": clientReveal,
          "project-reveal": projectReveal,
          "date-reveal": dateReveal,
          "position-reveal": positionReveal,
          "employer-reveal": employerReveal,
        })}
        data-scroll
        data-scroll-repeat
        data-scroll-id={`work-${index}-detail-roles`}
        data-scroll-speed={10}
        style={{
          top: top,
        }}
      >
        <div className="leading-[1.75] md:hidden">{detailItem}</div>
        <DetailRoles work={work} index={index} />
      </div>
    </>
  );
}

export default memo(Detail);
