import React from "react";
import svgPaths from "@/public/assets/data/svgPaths";
const GROWTH_IMG_1 = "/assets/images/growth/4325472e76c4d5900f149ba036fbb405adf1dee9.png";
const GROWTH_IMG_2 = "/assets/images/growth/630e8182ef13d32cd939eef9b57c5bdc733e9dd3.png";
const GROWTH_IMG_3 = "/assets/images/growth/8d7301a878915636181f3e0c5abd22deb05d82f7.png";
const GROWTH_IMG_4 = "/assets/images/growth/84bd5b09676f0ef13bd88c6c447bd2045d61969c.png";
const USERS_IMG = "/assets/images/users.png";
const RATINGS_ICON_SRC = "/assets/icons/ratings.svg";
function ArrowIcon() {
  return (
    <svg
      className="block size-[20.211px]"
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 20.2105 20.2105"
      aria-hidden="true"
    >
      <g>
        <path
          d={svgPaths.p271ab580}
          stroke="var(--stroke-0, white)"
          strokeLinecap="round"
          strokeWidth="1.26316"
        />
        <path
          d={svgPaths.p95f7a00}
          stroke="var(--stroke-0, white)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.26316"
        />
      </g>
    </svg>
  );
}
function ArrowButton() {
  return (
    <div className="bg-[rgba(255,255,255,0.14)] overflow-hidden rounded-[20.211px] size-[32px] flex items-center justify-center">
      <ArrowIcon />
    </div>
  );
}
type CardProps = {
  image: string;
  label: string;
  className?: string;
};
function Card({ image, label, className }: CardProps) {
  return (
    <div className={`grid rounded-[13px] overflow-hidden ${className ?? ""}`}>
      <img
        alt=""
        src={image}
        className="col-start-1 row-start-1 w-full h-full object-cover"
      />
      <div className="col-start-1 row-start-1 w-full h-full bg-[linear-gradient(180.106deg,rgba(18,18,18,0)_7.0887%,rgb(18,18,18)_99.855%)]" />
      <div className="col-start-1 row-start-1 w-full p-4 md:p-5 self-end flex items-center justify-between z-[1]">
        <p
          className="bg-clip-text bg-gradient-to-b from-white from-[23.469%] to-[#bababa] to-[77.551%] text-transparent font-['Grift:Medium',sans-serif] leading-[normal] not-italic text-base sm:text-lg md:text-[20px] uppercase"
          style={{ WebkitTextFillColor: "transparent" }}
        >
          {label}
        </p>
        <ArrowButton />
      </div>
    </div>
  );
}
function LeftPanel() {
  return (
    <div className="mx-auto max-w-md lg:max-w-none">
      <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs tracking-[0.12em] text-white/80">
        SMART GROWTH SOLUTIONS
      </div>
      <h2 className="mt-3 sm:mt-4 font-['Grift:Medium',sans-serif] text-xl sm:text-2xl md:text-[32px] lg:text-[40px] leading-[1.05] font-bold text-white">
        SMARTER GROWTH
        <br />
        <p className="mt-4">FOR WELLNESS</p>
      </h2>
      <div className="mt-4 sm:mt-6 inline-flex relative items-center gap-2 sm:gap-3 rounded-[999px] bg-[#80808030] border border-white px-3 sm:px-4 py-2 lg:py-3">
        <div className="absolute left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-[#8C21FF]/20 blur-[100px]" />
        <img alt="" src={USERS_IMG} className="h-8 w-auto" />
        <div>
          <div className="flex items-center gap-2">
            <img alt="" src={RATINGS_ICON_SRC} className="h-5 w-5" />
            <span className="text-white font-medium">
              “Feels like a real person on the line.”
            </span>
          </div>
          <div>
            <span className="text-xs text-white/70">
              Feedback from early medspa and clinic teams using InstaFlow.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
export function SmartGrowth() {
  return (
    <section
      id="industries"
      className="w-full px-4 sm:px-6 lg:px-0 max-w-7xl mx-auto pt-16 sm:pt-20 md:pt-28 lg:flex gap-6"
    >
      <div className="lg:w-[40%] w-full">
        <LeftPanel />
      </div>
      <div className="lg:w-[60%] lg:mt-0 mt-8 sm:mt-10 w-full min-w-0">
        <div className="mx-auto w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[407px_257px] items-end justify-center gap-3 sm:gap-4 md:gap-6">
          <Card
            image={GROWTH_IMG_1}
            label="saloon"
            className="h-[180px] sm:h-[220px] md:h-[300px] w-full md:w-[407px]"
          />
          <Card
            image={GROWTH_IMG_2}
            label="spa"
            className="h-[180px] sm:h-[220px] md:h-[300px] w-full md:w-[257px]"
          />
        </div>
        <div className="mt-4 sm:mt-6 mx-auto w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[257px_407px] items-end justify-center gap-3 sm:gap-4 md:gap-6">
          <Card
            image={GROWTH_IMG_3}
            label="Medical spa"
            className="h-[180px] sm:h-[220px] md:h-[340px] w-full md:w-[257px]"
          />
          <Card
            image={GROWTH_IMG_4}
            label="Barbershop"
            className="h-[180px] sm:h-[220px] md:h-[340px] w-full md:w-[407px]"
          />
        </div>
      </div>
    </section>
  );
}
