

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import "swiper/css";
// Add your own CSS file or inline style with:
import "../../styles/BrandLogosSlider.css"; // ← create this file
import webflowImg from "@/assets/brand-logo/Webflow.png";
import fedexImg from "@/assets/brand-logo/Fedex.png";
import grabImg from "@/assets/brand-logo/Grab.png";
import krateImg from "@/assets/brand-logo/krate.png";
import pandaImg from "@/assets/brand-logo/panda.png";
import tollbaseImg from "@/assets/brand-logo/tollbase.png";
import polltreeImg from "@/assets/brand-logo/polltree.png";
import miscImg from "@/assets/brand-logo/image 5.png";
import leftSvg from "@/assets/icons/left.svg";
import rightSvg from "@/assets/icons/right.svg";
// ... your imports for images remain the same

function HeadingBar() {
  return (
    <div className="sm:flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      <img src={leftSvg} alt="" className="h-[24px] sm:mx-0 mx-auto w-[60px] sm:h-[30px] sm:w-[80px] md:w-[100px] lg:w-[135px]" />
      <p className="text-white text-center uppercase tracking-[2px] text-[12px] sm:text-[16px]">
        Trusted by Over 500 Businesses
      </p>
      <img src={rightSvg} alt="" className="h-[24px] sm:mx-0 mx-auto w-[60px] sm:h-[30px] sm:w-[80px] md:w-[100px] lg:w-[135px]" />
    </div>
  );
}

function Logo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={`h-6 sm:h-7 md:h-8 w-auto opacity-70 hover:opacity-100 transition-opacity ${className ?? ""}`}
      loading="lazy"
    />
  );
}

export function BrandLogosSlider() {
  const logos = [
    { src: webflowImg, alt: "Webflow" },
    { src: fedexImg, alt: "FedEx" },
    { src: grabImg, alt: "Grab" },
    { src: krateImg, alt: "Krate" },
    { src: pandaImg, alt: "Panda" },
    { src: tollbaseImg, alt: "Tollbase" },
    { src: polltreeImg, alt: "Polltree" },
    { src: miscImg, alt: "Brand" },
  ];

  // Optional: duplicate logos for better seamlessness with few items
  const extendedLogos = [...logos, ...logos];

  return (
    <section className="w-full max-w-7xl pt-16 sm:pt-20 md:pt-28 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
      <HeadingBar />
      <div className="relative pb-16 sm:pb-20 md:pb-28 pt-6 sm:pt-10 w-full">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 lg:w-40 bg-gradient-to-r from-[#0a0312] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 lg:w-40 bg-gradient-to-l from-[#0a0312] to-transparent z-10" />

        <Swiper
          modules={[Autoplay, FreeMode]}
          loop={true}                  // already good
          speed={2000}                 // ← controls overall scrolling speed (higher = slower)
          autoplay={{
            delay: 0,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
            reverseDirection: false,
          }}
          freeMode={{
            enabled: true,
            momentum: false,           // important
            sticky: false,
          }}
          slidesPerView="auto"
          centeredSlides={false}
          spaceBetween={16}
          allowTouchMove={true}
          breakpoints={{
            640: { spaceBetween: 24 },
            768: { spaceBetween: 32 },
            1024: { spaceBetween: 57 },
          }}
          className="!overflow-visible"
          // wrapperClass="transition-transform duration-0"  ← remove or set to "" — not needed with linear timing
        >
          {extendedLogos.map((l, i) => (
            <SwiperSlide key={`${l.alt}-${i}`} className="!w-auto flex items-center justify-center">
              <Logo src={l.src} alt={l.alt} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}