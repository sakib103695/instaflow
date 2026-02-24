import React from "react";
import svgPaths from "@/assets/data/svgPaths";
import leftSvg from "@/assets/icons/left.svg";
import rightSvg from "@/assets/icons/right.svg";

function Pill() {
  return (
    <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3">
      <img src={leftSvg} alt="" className="h-[24px] w-[60px] sm:h-[30px] sm:w-[80px] md:w-[100px] lg:w-[135px]" />
      <p className="text-white uppercase tracking-[2px] text-[11px] sm:text-[12px] lg:text-[16px]">
        Effortless Appointment Growth
      </p>
      <img src={rightSvg} alt="" className="h-[24px] w-[60px] sm:h-[30px] sm:w-[80px] md:w-[100px] lg:w-[135px]" />
    </div>
  );
}

function Heading() {
  return (
    <div className="font-['Grift:Extra_Bold',sans-serif] mt-8 mb-12 text-center not-italic text-[24px] sm:text-[38px] md:text-[42.755px] leading-[1.1] uppercase">
      <p
        className="bg-clip-text font-bold bg-gradient-to-b from-white to-[#bababa]"
        style={{ WebkitTextFillColor: "transparent" }}
      >
        scale and security
      </p>
      <p
        className="bg-clip-text mx-auto font-bold bg-gradient-to-b from-white to-[#bababa] w-full sm:w-[391px] whitespace-pre-wrap"
        style={{ WebkitTextFillColor: "transparent" }}
      >
        Built for speed
      </p>
    </div>
  );
}

function FeatureIcon({ children }: { children?: React.ReactNode }) {
  return (
    <div className="bg-gradient-to-b from-[#6339bf] to-[#513f95] rounded-[39px] h-[65px] w-[65px] grid place-items-center overflow-clip">
      <div className="h-9 w-9">{children}</div>
    </div>
  );
}

function StarsIcon() {
  return (
    <svg className="block size-full" fill="none" viewBox="0 0 36 36" preserveAspectRatio="none">
      <g>
        <path d={svgPaths.pdba280} stroke="var(--stroke-0, #CFCFCF)" strokeLinejoin="round" strokeWidth="1.5" />
        <path d={svgPaths.p5d3d100} stroke="var(--stroke-0, #CFCFCF)" strokeLinejoin="round" strokeWidth="1.5" />
        <path d={svgPaths.p3c131f00} stroke="var(--stroke-0, #CFCFCF)" strokeLinejoin="round" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

function CallRingingIcon() {
  return (
    <svg className="block size-full" fill="none" viewBox="0 0 36 36" preserveAspectRatio="none">
      <g>
        <path d={svgPaths.p1acf0600} stroke="var(--stroke-0, #CFCFCF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d={svgPaths.p288d080} stroke="var(--stroke-0, #CFCFCF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

function EarthIcon() {
  return (
    <svg className="block size-full" fill="none" viewBox="0 0 36 36" preserveAspectRatio="none">
      <g>
        <path d={svgPaths.p19bfcd80} stroke="var(--stroke-0, #CFCFCF)" strokeLinejoin="round" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
<div
  className="relative rounded-[14px]
    p-6 sm:p-7 md:p-8
    w-full
    border-2 border-[#2a1550]
    bg-[radial-gradient(120%_120%_at_50%_50%,#25144a_0%,#1a0b2e_45%,#0e0618_100%)]
    shadow-[0_10px_28px_rgba(0,0,0,0.28),inset_0_0_20px_rgba(0,0,0,0.55)]"
>
      <div className="flex flex-col gap-[28px]">
        <FeatureIcon>{icon}</FeatureIcon>
        <div className="flex flex-col gap-[5px]">
          <p
            className="bg-clip-text bg-gradient-to-b font-['Grift:Bold',sans-serif] from-white to-[#bababa] text-[24px] sm:text-[26px] md:text-[28.75px] leading-[46.555px]"
            style={{ WebkitTextFillColor: "transparent" }}
          >
            {title}
          </p>
          <div className="font-['Grift:Medium',sans-serif] text-[#989898] text-[16px] sm:text-[17.5px] leading-normal">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Security() {
  return (
    <section className="w-full relative overflow-hidden
          bg-[#0c0616]
          py-16 sm:py-20 md:py-28 px-4 sm:px-6
          after:content-['']
          after:absolute after:bottom-0 after:left-0
          after:w-full after:h-[1px]
          after:bg-gradient-to-r
          after:from-transparent
          after:via-purple-400
          after:to-transparent  ">
        <div className="max-w-7xl mx-auto">
          <Pill />
          <Heading />
        </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-0 py-6 sm:py-8 md:py-10 flex flex-col gap-[24px] sm:gap-[32px] md:gap-[44px]">
      

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] sm:gap-[20px]">
          <FeatureCard
            title="Context Aware"
            description={
              <>
                <p className="mb-0">{`Our agents understand nuance, `}</p>
                <p>sarcasm, and intent, providing a genuinely human experience.</p>
              </>
            }
            icon={<StarsIcon />}
          />

          <FeatureCard
            title="Instant Pickup"
            description={
              <p>No robotic pauses. Handle unlimited concurrent calls with sub-second response times.</p>
            }
            icon={<CallRingingIcon />}
          />

          <FeatureCard
            title="Global Reach"
            description={
              <p>Speak to customers in 50+ languages with localized cultural understanding and perfect accents.</p>
            }
            icon={<EarthIcon />}
          />
        </div>
      </div>
    </section>
  );
}
