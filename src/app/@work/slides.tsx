'use client';
import { WorkData } from "@/app/@work/workitems";
import { useEffect, useState } from "react";
import { useLocomotiveScroll } from "react-locomotive-scroll";
import clsx from "clsx";
import Image from "next/image";
import {Swiper, SwiperSlide} from "swiper/react";
import { Navigation, Pagination, A11y, Keyboard, EffectCoverflow} from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';

export default function Slides({
    index,
    work,
    setImageSrcCallbackRef,
}:
Readonly<{
    index: number;
    work: WorkData;
    setImageSrcCallbackRef: any;
}>)
{
  const { scroll } = useLocomotiveScroll();
  const [showSlides, setShowSlides] = useState(false);
  const [slidesClasses, setSlidesClasses] = useState("text-xl w-full flex flex-col flex-wrap h-screen pt-[8rem] items-start justify-start content-start");

  useEffect(() => {
    setSlidesClasses(clsx({
      "relative h-screen w-screen flex flex-row items-center justify-center transition-all duration-1000": true,
      "saturate-[0.2] brightness-[0.2] blur-sm": !showSlides,
      "saturate-100 brightness-100 blur-[0px]": showSlides,
    }));
    if(showSlides)
    {
      document.documentElement.style.setProperty("--swiper-theme-color", work.primaryColor);
    }
  }, [showSlides, work]);

  useEffect(() => {
    if(scroll)
    {
      scroll.on("call", (f: string, type: string) => {
        if(f == `work${index}ShowSlides`)
        {
          setShowSlides(type == "enter");
        }
      });
    }
  }, [scroll, index]);

  return (
    <div
      className={slidesClasses}
    >
      <div id={`work-${index}-slides-left-el`} className={clsx({"group absolute top-0 left-0 w-[50vw] h-[calc(100vh-var(--swiper-pagination-bottom)-24px)] z-50": true, "hover:cursor-left": showSlides, "hidden": !showSlides})}></div>
      <div id={`work-${index}-slides-right-el`} className={clsx({"group absolute top-0 left-[50vw] w-[50vw] h-[calc(100vh-var(--swiper-pagination-bottom)-24px)] z-50": true, "hover:cursor-right": showSlides, "hidden": !showSlides})}></div>
      {work.images && setImageSrcCallbackRef.current && <Swiper
        id={`work-${index}-swiper`}
        modules={[Navigation, Pagination, A11y, Keyboard, EffectCoverflow]}
        spaceBetween={50}
        slidesPerView={1}
        navigation={{
          nextEl: `#work-${index}-slides-right-el`,
          prevEl: `#work-${index}-slides-left-el`
        }}
        pagination={{ clickable: true }}
        keyboard={{enabled: true}}
        freeMode
        effect="coverflow"
        coverflowEffect={{
        }}
        loop
        speed={1000}
        onSlideChange={(slider) => {
          if(work.images)
          {
            setImageSrcCallbackRef.current(work.images[parseInt((slider.slides[slider.activeIndex].firstChild! as HTMLElement).dataset.index as string)]);
          }
        }}
      >
      {work.images && work.images.map((image: any, index: number) => <SwiperSlide key={`image-${index}`}><Image data-index={index} className="w-screen h-screen object-cover" alt="boop" width={0} height={0} sizes="100vw" src={image}/></SwiperSlide>)}
      </Swiper>}
    </div>
  )
}