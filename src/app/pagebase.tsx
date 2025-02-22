"use client";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useRouter, usePathname } from "next/navigation";
import { useLocomotiveScroll } from "@/lib/locomotive";
import { useGlobalState, manualPush, navigating, pathList } from "@/lib/state";

export default function PageBase({
  id,
  thisPathName,
  pathTest,
  render,
  index,
  intersectionOffset = 0,
  overrideHeight,
  overridePaddingBottom,
  overrideContentTop,
}: Readonly<{
  id: string;
  thisPathName: string;
  pathTest: (pathname: string, thisPathname: string, index?: number) => boolean;
  render: (params: { index?: number }) => React.ReactNode;
  index?: number;
  intersectionOffset?: number;
  overrideHeight?: string;
  overridePaddingBottom?: string;
  overrideContentTop?: string;
}>) {
  const [pathMatch, setPathMatch] = useState(false);
  const scrollMatchRef = useRef(false);
  const [active, setActive] = useState(false);
  const [currentActive, setCurrentActive] = useGlobalState("active");
  const currentActiveRef = useRef(currentActive);
  const [activeList, setActiveList] = useGlobalState("activeList");
  const setCurrentInView = useGlobalState("inView")[1];
  const [, setNavigating] = useGlobalState("navigating");

  const { scroll } = useLocomotiveScroll();
  const [pageClasses, setPageClasses] = useState("opacity-0");
  const [contentClasses, setContentClasses] = useState("");
  const [doneLoading, setDoneLoading] = useGlobalState("doneLoading");

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    pathList.current.push({ pathName: thisPathName, id });
  }, [thisPathName, id]);

  useEffect(() => {
    setPathMatch(pathTest(pathname, thisPathName, index));
    scrollMatchRef.current =
      (pathname == "/" || pathname == "/work") &&
      (currentActiveRef.current == "home" ||
        currentActiveRef.current == "work-intro");
  }, [pathname, thisPathName, index, pathTest]);

  useEffect(() => {
    if (doneLoading) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((value) => {
          if (value.target.id == id && value.rootBounds) {
            if (
              value.isIntersecting &&
              value.intersectionRect.top / value.rootBounds.height! >=
                intersectionOffset
            ) {
              setCurrentInView((previousCurrentInView) => {
                if (!previousCurrentInView.includes(id)) {
                  return [id, ...previousCurrentInView];
                } else {
                  return previousCurrentInView;
                }
              });
            } else {
              setCurrentInView((previousCurrentInView) => {
                const result = [
                  ...previousCurrentInView.filter((thisId) => thisId != id),
                ];
                return result;
              });
            }
          }
          if (value.target.id == `${id}-content` && value.rootBounds) {
            if (
              value.isIntersecting &&
              value.intersectionRect.top / value.rootBounds.height! >=
                intersectionOffset
            ) {
              setActiveList((previousActiveList) => {
                if (!previousActiveList.includes(id)) {
                  return [...previousActiveList, id];
                } else {
                  return previousActiveList;
                }
              });
            } else {
              setActiveList((previousActiveList) => {
                const result = [
                  ...previousActiveList.filter((thisId) => thisId != id),
                ];
                return result;
              });
            }
          }
        });
      });
      observer.observe(document.getElementById(id) as HTMLElement);
      observer.observe(document.getElementById(`${id}-content`) as HTMLElement);
    }
  }, [id, setActiveList, setCurrentInView, intersectionOffset, doneLoading]);

  useEffect(() => {
    setCurrentActive(() => {
      currentActiveRef.current = activeList[activeList.length - 1];
      return activeList[activeList.length - 1];
    });
  }, [activeList, setCurrentActive]);

  useEffect(() => {
    if (currentActive) {
      setActive(currentActive == id);
    }
  }, [currentActive, id]);

  useEffect(() => {
    if (scroll) {
      if (pathMatch && !navigating.current) {
        if (!manualPush.current) {
          navigating.current = true;
          setNavigating(true);
          if (scrollMatchRef.current) {
            setDoneLoading(true);
            scroll.scrollTo(`#${id}`, {
              callback: () => {
                setTimeout(() => {
                  navigating.current = false;
                  setNavigating(false);
                  manualPush.current = false;
                }, 1000);
              },
              offset: -document.documentElement.clientHeight + 1,
              duration: 1000,
              disableLerp: true,
            });
          } else {
            setDoneLoading(true);
            scroll.setScroll(
              0,
              Math.max(
                0,
                document.getElementById(id)!.offsetTop -
                  document.documentElement.clientHeight +
                  1
              )
            );
            scroll.scrollTo(`#${id}`, {
              callback: () => {
                setTimeout(() => {
                  navigating.current = false;
                  setNavigating(false);
                  manualPush.current = false;
                }, 250);
              },
              offset: -document.documentElement.clientHeight + 1,
              duration: 0,
              disableLerp: true,
            });
          }
        } else {
          manualPush.current = false;
        }
      }
    }
  }, [pathMatch, scroll, id, setNavigating, setDoneLoading]);

  useEffect(() => {
    if (active) {
      window.history.pushState(null, "", thisPathName);
      if (!navigating.current) {
        manualPush.current = true;
      }
    }
  }, [scroll, thisPathName, active, id, router]);

  useEffect(() => {
    setPageClasses(
      clsx({
        "relative will-change-opacity transition-opacity duration-1000": true,
        "pb-[100dvh]": !overridePaddingBottom,
        "opacity-100": active,
        "opacity-0": !active,
      })
    );
    setContentClasses(
      clsx({
        "w-screen absolute": true,
        "h-full": !overrideHeight,
        "top-[100dvh]": !overrideContentTop,
      })
    );
    const loading = document.getElementById("loading");
    if (loading) {
      loading.style.opacity = "0";
    }
  }, [active, overrideHeight, overridePaddingBottom, overrideContentTop]);

  return (
    <div
      id={id}
      className={pageClasses}
      data-scroll
      data-scroll-repeat
      data-scroll-call="inView"
      data-scroll-id={id}
      {...(overridePaddingBottom && {
        style: { paddingBottom: overridePaddingBottom },
      })}
    >
      <div className="relative h-full">
        <div
          className={contentClasses}
          id={`${id}-content`}
          data-scroll
          data-scroll-repeat
          data-scroll-call="active"
          data-scroll-id={`${id}-content`}
          {...((overrideContentTop || overrideHeight) && {
            style: {
              ...(overrideContentTop && { top: overrideContentTop }),
              ...(overrideHeight && { top: overrideHeight }),
            },
          })}
        ></div>
        {render({ index })}
      </div>
    </div>
  );
}
