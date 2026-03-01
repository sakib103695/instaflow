 "use client";


import React from "react";
const AVATAR1_SRC = "/assets/images/testimonial-person1.png";
const AVATAR2_SRC = "/assets/images/testimonial-person2.png";
const AVATAR3_SRC = "/assets/images/testimonial-person3.png";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const LEFT_ICON_SRC = "/assets/icons/left.svg";
const RIGHT_ICON_SRC = "/assets/icons/right.svg";


type Testimonial = {
  name: string;
  title: string;
  text: string;
  avatar: string;
};

function AvatarRow({
  src,
  name,
  title,
}: {
  src: string;
  name: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <img
        alt={`${name} avatar`}
        className="w-[42px] h-[42px] rounded-full"
        src={src}
        loading="lazy"
        width={42}
        height={42}
      />
      <div className="flex flex-col">
        <p className="font-semibold text-[15px] text-white">{name}</p>
        <p className="text-white text-[12px]">{title}</p>
      </div>
    </div>
  );
}

function TestimonialCard({
  avatar,
  name,
  title,
  text,
}: {
  avatar: string;
  name: string;
  title: string;
  text: string;
}) {
  return (
    <article
      className="relative rounded-[14px]
    p-6 sm:p-7 md:p-8
    w-full
    border-2 border-[#2a1550]
    bg-[radial-gradient(120%_120%_at_50%_50%,#25144a_0%,#1a0b2e_45%,#0e0618_100%)]
    shadow-[0_10px_28px_rgba(0,0,0,0.28),inset_0_0_20px_rgba(0,0,0,0.55)]"
    >
      <div className="p-6 flex flex-col gap-6 h-full justify-between">
        <p
          className="text-[#ADADAD] text-[16px] font-medium leading-[24px]"
          style={{ fontFamily: "'Monsiret', sans-serif" }}
        >
          {text}
        </p>

        <div className="pt-4">
          <AvatarRow src={avatar} name={name} title={title} />
        </div>
      </div>
    </article>
  );
}

const testimonials: Testimonial[] = [
  {
    avatar: AVATAR3_SRC,
    name: "Mrs. Van Hartmann",
    title: "Legacy Usability Manager",
    text:
      "InstaFlow completely transformed how we manage incoming calls. We no longer miss bookings, response times improved dramatically, and confirmed appointments increased without hiring additional front desk staff.",
  },
  {
    avatar: AVATAR1_SRC,
    name: "Mrs. Alex Doe",
    title: "Legacy Usability Manager",
    text:
      "InstaFlow completely transformed how we manage incoming calls. We no longer miss bookings, response times improved dramatically, and confirmed appointments increased without hiring additional front desk staff.",
  },
  {
    avatar: AVATAR2_SRC,
    name: "Mr John Kallu",
    title: "Legacy Usability Manager",
    text:
      "InstaFlow completely transformed how we manage incoming calls. We no longer miss bookings, response times improved dramatically, and confirmed appointments increased without hiring additional front desk staff.",
  },
];

function Heading() {
  return (
    
    <div className="text-center pt-4 uppercase w-full">
      <p
        className="bg-clip-text font-bold bg-gradient-to-b from-white to-[#bababa] text-[40px] leading-[46.555px]"
        style={{ WebkitTextFillColor: "transparent" }}
      >
        Trusted by Growing 
      </p>
      <p
        className="bg-clip-text font-bold bg-gradient-to-b from-white to-[#bababa] text-[40.75px] leading-[46.555px]"
        style={{ WebkitTextFillColor: "transparent" }}
      >
        Businesses Worldwide
      </p>
    </div>
  );
}

export const Testimonial = () => {
  return (
    <section
      className="relative overflow-hidden py-28
          bg-[#0c0616]
          shadow-[inset_0_0_80px_0_rgba(141,35,255,0.12)]

          before:content-['']
          before:absolute before:top-0 before:left-0
          before:w-full before:h-[1px]
          before:bg-gradient-to-r
          before:from-transparent
          before:via-purple-400
          before:to-transparent

          after:content-['']
          after:absolute after:bottom-0 after:left-0
          after:w-full after:h-[1px]
          after:bg-gradient-to-r
          after:from-transparent
          after:via-purple-400
          after:to-transparent"
      aria-label="Testimonials"
    >
      <div className="pb-20">
        <div className="flex justify-center items-center gap-3">
          <img src={LEFT_ICON_SRC} alt="" className="h-[30px] w-[80px] md:w-[100px] lg:w-[135px]" />
          <p className="text-white uppercase tracking-[2px] text-[16px]">
            Testimonial
          </p>
          <img src={RIGHT_ICON_SRC} alt="" className="h-[30px] w-[80px] md:w-[100px] lg:w-[135px]" />
        </div>
        <Heading />
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={24}
          loop={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{
            el: ".custom-pagination",
            clickable: true,
          }}
          breakpoints={{
            0: { slidesPerView: 1 },
            640: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 2 },
          }}
        >
          {testimonials.map((t, index) => (
            <SwiperSlide key={`${t.name}-${index}`} className="!h-auto">
              <TestimonialCard
                avatar={t.avatar}
                name={t.name}
                title={t.title}
                text={t.text}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Pagination BELOW cards */}
        <div className="custom-pagination mt-10 flex justify-center items-center gap-3" />
      </div>

      {/* Custom Pagination Styling */}
      <style>{`
        .custom-pagination .swiper-pagination-bullet {
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: white;
          border: 2px solid white;
          opacity: 1;
          transition: all 0.3s ease;
        }

        .custom-pagination .swiper-pagination-bullet-active {
          background: #8b5cf6;
          transform: scale(1.1);
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.6);
          border: 2px solid #8b5cf6;
        }
      `}</style>
    </section>
  );
}
