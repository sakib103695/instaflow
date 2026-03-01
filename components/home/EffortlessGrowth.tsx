import React from "react";
const LEFT_ICON_SRC = "/assets/icons/left.svg";
const RIGHT_ICON_SRC = "/assets/icons/right.svg";

export default function EffortlessGrowth() {
  return (
    <section id="features" className="w-full relative pt-6 sm:pt-10 md:pt-16 px-4 sm:px-6">
      <div
        className="
          relative overflow-hidden py-10 sm:py-12 md:py-14
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
          after:to-transparent
        "
      >
        {/* Glow Background */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] rounded-full bg-[#8C21FF]/20 blur-[80px] sm:blur-[100px]" />

        <div className="flex flex-col items-center gap-6 sm:gap-8 relative z-10 py-8 sm:py-12 px-2 sm:px-0">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <img src={LEFT_ICON_SRC} alt="" className="h-[24px] w-[60px] sm:h-[30px] sm:w-[80px] md:w-[100px] lg:w-[135px]" />
            <p className="text-white uppercase tracking-[2px] text-[11px] sm:text-[12px] md:text-[16px]">
              Effortless Appointment Growth
            </p>
            <img src={RIGHT_ICON_SRC} alt="" className="h-[24px] w-[60px] sm:h-[30px] sm:w-[80px] md:w-[100px] lg:w-[135px]" />
          </div>

          <div className="text-center">
            <h3 className="max-w-4xl mx-auto font-['Raleway',sans-serif] font-semibold text-white text-base sm:text-lg md:text-[20px] lg:text-[28px] xl:text-[33.72px] leading-snug sm:leading-[1.4] md:leading-[40.9px]">
            InstaFlow answers <span className="text-[#BBBBBB]">every call, handles the 
conversation, and locks in appointments.</span>  Day or night, without you lifting a finger.
              {/* <span className="text-[#BBBBBB]">
                no staff overload. Just consistent bookings 24/7.
              </span> */}
            </h3>
          </div>

          <button
            className="
              mt-0 sm:mt-2 px-4 sm:px-6 py-3 sm:py-4 rounded-full
              bg-white text-[#0a0312]
              text-xs sm:text-sm font-semibold uppercase
              cursor-pointer
            "
          >
            Book More Appointments
          </button>
        </div>
      </div>
    </section>
  );
}