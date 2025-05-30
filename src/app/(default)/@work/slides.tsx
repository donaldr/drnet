"use client";
import { WorkData } from "@/app/(default)/@work/workitems";
import { useEffect, useState } from "react";
import { useLocomotiveScroll } from "@/lib/locomotive";
import clsx from "clsx";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Navigation,
  Pagination,
  A11y,
  Keyboard,
  EffectCoverflow,
} from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";

export default function Slides({
  index,
  work,
  setImageSrcCallbackRef,
}: Readonly<{
  index: number;
  work: WorkData;
  setImageSrcCallbackRef: any;
}>) {
  const { scroll } = useLocomotiveScroll();
  const [showSlides, setShowSlides] = useState(false);
  const [slidesClasses, setSlidesClasses] = useState(
    "text-xl w-full flex flex-col flex-wrap h-[100dvh] pt-[8rem] items-start justify-start content-start"
  );

  useEffect(() => {
    setSlidesClasses(
      clsx({
        "relative flex flex-row items-center justify-center transition-[filter] duration-1000":
          true,
        "saturate-[0.2] brightness-[0.2] blur-sm": !showSlides,
        "saturate-100 brightness-100 blur-[0px]": showSlides,
        "mx-[10dvw]": work.needsPadding,
        "my-[10dvh]": work.needsPadding,
        "w-[80dvw]": work.needsPadding,
        "h-[80dvh]": work.needsPadding,
        "w-[100dvw]": !work.needsPadding,
        "h-[100dvh]": !work.needsPadding,
      })
    );
    if (showSlides) {
      document.documentElement.style.setProperty(
        "--swiper-theme-color",
        work.primaryColor
      );
    }
  }, [showSlides, work]);

  useEffect(() => {
    if (scroll) {
      scroll.on("call", (f: string, type: string) => {
        if (f == `work${index}ShowSlides`) {
          setShowSlides(type == "enter");
        }
      });
    }
  }, [scroll, index]);

  return (
    <div className={slidesClasses}>
      <div
        id={`work-${index}-slides-left-el`}
        className={clsx({
          "group absolute top-0 left-0 w-[50dvw] h-[calc(100dvh-var(--swiper-pagination-bottom)-24px)] z-50":
            true,
          "hover:cursor-left": showSlides,
          hidden: !showSlides,
        })}
      ></div>
      <div
        id={`work-${index}-slides-right-el`}
        className={clsx({
          "group absolute top-0 left-[50dvw] w-[50dvw] h-[calc(100dvh-var(--swiper-pagination-bottom)-24px)] z-50":
            true,
          "hover:cursor-right": showSlides,
          hidden: !showSlides,
        })}
      ></div>
      {work.images && setImageSrcCallbackRef.current && (
        <Swiper
          id={`work-${index}-swiper`}
          modules={[Navigation, Pagination, A11y, Keyboard, EffectCoverflow]}
          spaceBetween={50}
          slidesPerView={1}
          navigation={{
            nextEl: `#work-${index}-slides-right-el`,
            prevEl: `#work-${index}-slides-left-el`,
          }}
          pagination={{ clickable: true }}
          keyboard={{ enabled: true }}
          freeMode
          effect="coverflow"
          coverflowEffect={{}}
          loop
          speed={1000}
          onSlideChange={(slider) => {
            if (work.images) {
              setImageSrcCallbackRef.current(
                work.images[
                  parseInt(
                    (
                      slider.slides[slider.activeIndex]
                        .firstChild! as HTMLElement
                    ).dataset.index as string
                  )
                ]
              );
            }
          }}
        >
          {work.images &&
            work.images.map((image: any, index: number) => (
              <SwiperSlide key={`image-${index}`}>
                <Image
                  data-index={index}
                  className={clsx({
                    "w-screen h-[100dvh]": !work.needsPadding,
                    "w-[80dvw] h-[80dvh]": work.needsPadding,
                    "object-contain": work.needsPadding,
                    "object-cover": !work.needsPadding,
                  })}
                  alt="boop"
                  width={0}
                  height={0}
                  sizes="100dvw"
                  src={image}
                  loading="lazy"
                  fetchPriority="low"
                  priority={false}
                  unoptimized
                />
              </SwiperSlide>
            ))}
        </Swiper>
      )}
    </div>
  );
}
