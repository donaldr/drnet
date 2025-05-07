"use client";
import { WorkData } from "@/app/(default)/@work/workitems";
import {
  memo,
  Profiler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import clsx from "clsx";
import {
  useDebounce,
  useProfilerRender,
  useTemplateFunction,
} from "@/lib/customhooks";
import interpolateComponents from "@automattic/interpolate-components";
import DetailItem from "./detailitem";
import { useLocomotiveScroll } from "@/lib/locomotive";
import DetailRoles from "./detailroles";
import {
  decrementEventHandlerCount,
  incrementEventHandlerCount,
} from "@/lib/state";

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
  const debouncer = useDebounce();
  const profilerRender = useProfilerRender({ minDuration: 10 });
  const previousScrollYRef = useRef<number | null>(null);

  const { scroll } = useLocomotiveScroll();

  useEffect(() => {
    if (scroll) {
      incrementEventHandlerCount("scroll-detail");
      scroll.on("scroll", (obj: any) => {
        let direction;
        if (
          previousScrollYRef.current == null ||
          previousScrollYRef.current < obj.scroll.y
        )
          direction = "down";
        else if (
          previousScrollYRef.current != null &&
          previousScrollYRef.current > obj.scroll.y
        )
          direction = "up";
        if (sizeRef.current && sizeRef.current[0] < 768) {
          const key = `work-${index}-detail-main-small`;
          if (key in obj.currentElements) {
            const el = obj.currentElements[key];
            if (el.progress > 0.25 && el.progress < 0.75) {
              setClientReveal(true);
              setDateReveal(true);
              setPositionReveal(true);
              setProjectReveal(true);
              setEmployerReveal(true);
            } else {
              setClientReveal(false);
              setDateReveal(false);
              setPositionReveal(false);
              setProjectReveal(false);
              setEmployerReveal(false);
            }
          }
        } else {
          const key = `work-${index}-detail-target`;
          if (key in obj.currentElements) {
            const el = obj.currentElements[key];
            const progress = el.progress;
            if (
              (progress > 0.28 && progress < 0.6 && direction == "down") ||
              (progress > 0.4 && progress < 0.7 && direction == "up")
            ) {
              setReveal(true);
            } else if (
              (progress < 0.4 && direction == "up") ||
              (progress > 0.6 && direction == "down")
            ) {
              setReveal(false);
            }
            if (
              (progress > 0.281 && progress < 0.599 && direction == "down") ||
              (progress > 0.401 && progress < 0.699 && direction == "up")
            ) {
              setClientReveal(true);
              setDateReveal(true);
              setPositionReveal(true);
              setProjectReveal(true);
              setEmployerReveal(true);
            } else if (
              (progress < 0.401 && direction == "up") ||
              (progress > 0.599 && direction == "down")
            ) {
              setClientReveal(false);
              setDateReveal(false);
              setPositionReveal(false);
              setProjectReveal(false);
              setEmployerReveal(false);
            }
          }
        }
        previousScrollYRef.current = obj.scroll.y;
      });
    }
  }, [scroll, index]);

  const resize = useCallback(() => {
    debouncer(() => {
      setSize([
        document.documentElement.clientWidth,
        document.documentElement.clientHeight,
      ]);
    });
  }, [debouncer]);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  useEffect(() => {
    resize();
    incrementEventHandlerCount("resize-detail");
    window.addEventListener("resize", resize);
    return () => {
      decrementEventHandlerCount("resize-detail");
      window.removeEventListener("resize", resize);
    };
  }, [resize]);

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
          "group absolute px-[5dvw] md:text-xl lg:text-2xl h-[100dvh] w-[50dvw] z-50 box-border will-change-transform max-w-[64rem] md:flex items-center justify-center leading-loose transition-[opacity] duration-1000 hidden":
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
        data-scroll-target={`#work-${index}-detail-target`}
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
          "group absolute px-[5dvw] text-xl h-[150dvh] w-full md:w-[50dvw] z-50 box-border md:left-[min(50dvw,64rem)] will-change-transform max-w-[64rem] flex flex-col items-center justify-center":
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
        data-scroll-speed={size && size[0] > 768 ? 10 : 1}
        style={{
          top: top,
        }}
      >
        <div
          data-scroll
          data-scroll-id={`work-${index}-detail-main-small`}
          className="leading-[1.75] md:hidden"
        >
          <Profiler id="detail-item" onRender={profilerRender}>
            {detailItem}
          </Profiler>
        </div>
        <Profiler id="detail-roles" onRender={profilerRender}>
          <DetailRoles work={work} index={index} />
        </Profiler>
      </div>
    </>
  );
}

export default memo(Detail);
