"use client";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { SplitText } from "@rigo-m/react-split-text";
import { useLocomotiveScroll } from "react-locomotive-scroll";
import { WorkData } from "@/app/@work/workitems";

function DetailRoles({
  work,
  index,
}: Readonly<{
  work: WorkData;
  index: number;
}>) {
  const ref = useRef<HTMLDivElement>(null);
  const { scroll } = useLocomotiveScroll();
  const [, setRedraw] = useState(0);

  useEffect(() => {
    if (scroll) {
      scroll.on("scroll", (obj: any) => {
        const els = Object.entries(obj.currentElements)
          .filter((kvp) => kvp[0].startsWith("work-detail-line"))
          .map((kvp) => kvp[1]);
        els.forEach((el: any) => {
          const foundEl = document.getElementById(el.id)!;
          if (foundEl) {
            const rect = document
              .getElementById(el.id)!
              .parentElement!.getBoundingClientRect();

            const progress = rect.top / document.documentElement.clientHeight;

            document.getElementById(el.id)!.style.opacity = Math.min(
              1,
              Math.pow(Math.max(0, 1 - 2.5 * Math.abs(progress - 0.5)), 0.5) +
                0.375
            ).toFixed(3);
            document.getElementById(el.id)!.style.transform = `scale(${Math.min(
              1,
              Math.max(0, 1 - Math.pow(Math.abs(progress - 0.5) * 2, 15) / 2)
            ).toFixed(3)})`;
            document.getElementById(el.id)!.style.top = `${(
              Math.pow(Math.abs(progress - 0.5), 2) *
              20 *
              ((progress - 0.5) / Math.abs(progress - 0.5))
            ).toFixed(2)}vh`;
          }
        });
      });
    }
  }, [scroll]);

  const resize = useCallback(() => {
    setRedraw((prev) => prev + 1);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  return (
    <div ref={ref} className="w-full md:px-0">
      {work.roles.map((role, i) => {
        return (
          <div key={role}>
            <div
              data-scroll
              data-scroll-id={`work-detail-line-${index}-${i}`}
              className="label text-sm mb-2 mt-12 relative"
            >
              <div
                id={`work-detail-line-${index}-${i}`}
                className="absolute w-full"
              >
                {role}
              </div>
              <span className="opacity-0">{role}</span>
            </div>
            {
              //@ts-expect-error SplitText says it doesn't take children but it does
              <SplitText
                //@ts-expect-error LineWrapper says it doesn't have children parameter but it does
                LineWrapper={({ children, lineIndex }) => {
                  return (
                    <div
                      data-scroll
                      data-scroll-id={`work-detail-line-${index}-${i}-${lineIndex}`}
                      className="relative"
                    >
                      <div
                        id={`work-detail-line-${index}-${i}-${lineIndex}`}
                        className="absolute w-full"
                      >
                        {children}
                      </div>
                      <span className="opacity-0">{children}</span>
                    </div>
                  );
                }}
              >
                {work.responsibilities[i].replaceAll(/-/g, "\u2011")}
              </SplitText>
            }
          </div>
        );
      })}
    </div>
  );
}

export default memo(DetailRoles);
