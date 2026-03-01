import React from "react";
import svgPaths from "@/public/assets/data/svgPaths";
const HIGHLIGHT_IMG_SRC = "/assets/images/conversation3.jpg";
const LEFT_ICON_SRC = "/assets/icons/left.svg";
const RIGHT_ICON_SRC = "/assets/icons/right.svg";
function Frame134() {
  return (
    <div className="flex items-center justify-center gap-3">
      <img
        src={LEFT_ICON_SRC}
        alt=""
        className="h-[30px] w-[80px] md:w-[100px] lg:w-[135px]"
      />
      <p className="text-white uppercase tracking-[2px] text-[11px] md:text-[16px]">
        Why Choose Us
      </p>
      <img
        src={RIGHT_ICON_SRC}
        alt=""
        className="h-[30px] w-[80px] md:w-[100px] lg:w-[135px]"
      />
    </div>
  );
}

function Group52() {
  return (
    <div className="font-['Grift:Extra_Bold',sans-serif] text-center uppercase text-xl sm:text-2xl md:text-3xl lg:text-[42.755px]">
      <p
        className="font-bold bg-gradient-to-b from-white to-[#bababa] bg-clip-text"
        style={{ WebkitTextFillColor: "transparent" }}
      >
        Why Growing Businesses
      </p>

      <p
        className="font-bold mt-2 sm:mt-4 bg-gradient-to-b from-white to-[#bababa] bg-clip-text mx-auto"
        style={{ WebkitTextFillColor: "transparent" }}
      >
        Choose InstaFlow
      </p>
    </div>
  );
}

function Frame5() {
  return (
    <button className="w-[200px] cursor-pointer h-[50px] bg-[#7711e5] rounded-[26px] flex items-center justify-center">
      <p className="font-['Cottorway_Pro:SemiBold',sans-serif] text-[15px] text-white tracking-[0.6px] uppercase">
        Talk to an AI Agent
      </p>
    </button>
  );
}

function Frame132() {
  return (
    <div className="content-stretch flex flex-col gap-6 items-start justify-between pb-[24px] relative shrink-0 w-full md:flex-row md:items-end md:gap-0 md:pb-[35px]">
      <div
        aria-hidden="true"
        className="absolute border-[rgba(255,255,255,0.1)] border-b border-solid inset-0 pointer-events-none"
      />
      <Frame133 />
      {/* <Frame5 /> */}
    </div>
  );
}

function Frame133() {
  return (
    <div className="content-stretch flex flex-col items-center gap-[30px] relative shrink-0 w-full">
      <Frame134 />
      <Group52 />
    </div>
  );
}

function Frame137() {
  return (
    <div className="relative rounded-[12px] sm:rounded-[15px] shrink-0 w-full max-w-[664px] h-[200px] sm:h-[260px] md:h-[360px] lg:h-[457px] min-h-[180px]">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none rounded-[15px]"
      >
        <div className="absolute bg-white inset-0 rounded-[15px]" />
        <img
          alt=""
          className="absolute max-w-none object-cover rounded-[15px] size-full"
          src={HIGHLIGHT_IMG_SRC}
        />
      </div>
    </div>
  );
}

function CallRinging() {
  return (
    <div
      className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[42px] top-1/2"
      data-name="call-ringing-04"
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 42 42"
      >
        <g id="call-ringing-04">
          <path
            d={svgPaths.p1c6f4b00}
            id="Vector"
            stroke="var(--stroke-0, black)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <path
            d={svgPaths.peca4280}
            id="Vector_2"
            stroke="var(--stroke-0, black)"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
}

function Frame141() {
  return (
    <div className="overflow-clip relative rounded-[16px] shrink-0 size-[72px]">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none rounded-[16px]"
      >
        <div className="absolute bg-[#cd9eff] inset-0 rounded-[16px]" />
        <div className="absolute bg-gradient-to-b from-white inset-0 mix-blend-soft-light rounded-[16px] to-black" />
        <div
          className="absolute inset-0 rounded-[16px]"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 72 72\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.20000000298023224\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(5.31 5.675 -5.675 5.31 11.45 9.75)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(255,255,255,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>')",
          }}
        />
      </div>
      <CallRinging />
    </div>
  );
}

function Frame142() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start leading-[normal] not-italic relative shrink-0 text-white w-full max-w-[372px] whitespace-pre-wrap">
      <p className="font-['Grift:Bold',sans-serif] relative shrink-0 text-[15px] sm:text-[17.5px] uppercase w-full">
        Instant Pickup, Zero Missed Leads
      </p>
      <div className="font-['Grift:Medium',sans-serif] relative shrink-0 text-[13px] sm:text-[15px] w-full">
        <p className="mb-0">{`Every caller gets answered in seconds, so you never `}</p>
        <p>lose customers to voicemail, hold time, or closed hours.</p>
      </div>
    </div>
  );
}

function Frame140() {
  return (
    <div className="content-stretch lg:flex gap-[20px] items-start relative shrink-0 w-full">
      <Frame141 />
      <div className="mt-4 lg:mt-0">
        <Frame142 />
      </div>
    </div>
  );
}

function Voice() {
  return (
    <div
      className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[42px] top-1/2"
      data-name="voice"
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 42 42"
      >
        <g id="voice">
          <path
            d={svgPaths.p2224f480}
            id="Vector"
            stroke="var(--stroke-0, #141B34)"
            strokeWidth="1.5"
          />
          <path
            d="M21 14V28"
            id="Vector_2"
            stroke="var(--stroke-0, #141B34)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <path
            d="M15.75 17.5V24.5"
            id="Vector_3"
            stroke="var(--stroke-0, #141B34)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <path
            d="M10.5 19.25V22.75"
            id="Vector_4"
            stroke="var(--stroke-0, #141B34)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <path
            d="M26.25 17.5V24.5"
            id="Vector_5"
            stroke="var(--stroke-0, #141B34)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <path
            d="M31.5 19.25V22.75"
            id="Vector_6"
            stroke="var(--stroke-0, #141B34)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
}

function Frame144() {
  return (
    <div className="overflow-clip relative rounded-[16px] shrink-0 size-[72px]">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none rounded-[16px]"
      >
        <div className="absolute bg-[#cd9eff] inset-0 rounded-[16px]" />
        <div className="absolute bg-gradient-to-b from-white inset-0 mix-blend-soft-light rounded-[16px] to-black" />
        <div
          className="absolute inset-0 rounded-[16px]"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 72 72\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.20000000298023224\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(5.31 5.675 -5.675 5.31 11.45 9.75)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(255,255,255,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>')",
          }}
        />
      </div>
      <Voice />
    </div>
  );
}

function Frame145() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start leading-[normal] not-italic relative shrink-0 text-white w-full max-w-[372px] whitespace-pre-wrap">
      <p className="font-['Grift:Bold',sans-serif] relative shrink-0 text-[15px] sm:text-[17.5px] uppercase w-full">
        Natural Voice That Builds Trust
      </p>
      <p className="font-['Grift:Medium',sans-serif] relative shrink-0 text-[13px] sm:text-[15px] w-full">{`Human-like tone and pacing make conversations feel real,increasing conversions and customer satisfaction. `}</p>
    </div>
  );
}

function Frame143() {
  return (
    <div className="content-stretch lg:flex gap-[20px] items-start relative shrink-0 w-full">
      <Frame144 />
      <div className="mt-4 lg:mt-0">
        <Frame145 />
      </div>
    </div>
  );
}

function Component24HoursClock() {
  return (
    <div
      className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[42px] top-1/2"
      data-name="24-hours-clock"
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 42 42"
      >
        <g id="24-hours-clock">
          <path
            d={svgPaths.p20c290a0}
            id="Vector"
            stroke="var(--stroke-0, #141B34)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <path
            d={svgPaths.p3f9d0700}
            id="Vector_2"
            stroke="var(--stroke-0, #141B34)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <path
            d={svgPaths.p2159a798}
            id="Vector_3"
            stroke="var(--stroke-0, #141B34)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
}

function Frame147() {
  return (
    <div className="overflow-clip relative rounded-[16px] shrink-0 size-[72px]">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none rounded-[16px]"
      >
        <div className="absolute bg-[#cd9eff] inset-0 rounded-[16px]" />
        <div className="absolute bg-gradient-to-b from-white inset-0 mix-blend-soft-light rounded-[16px] to-black" />
        <div
          className="absolute inset-0 rounded-[16px]"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 72 72\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.20000000298023224\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(5.31 5.675 -5.675 5.31 11.45 9.75)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(255,255,255,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>')",
          }}
        />
      </div>
      <Component24HoursClock />
    </div>
  );
}

function Frame148() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start leading-[normal] not-italic relative shrink-0 text-white w-full max-w-[372px] whitespace-pre-wrap">
      <p className="font-['Grift:Bold',sans-serif] relative shrink-0 text-[15px] sm:text-[17.5px] uppercase w-full">
        Unlimited Calls Without Hiring Staff
      </p>
      <p className="font-['Grift:Medium',sans-serif] relative shrink-0 text-[13px] sm:text-[15px] w-full">
        Handle high call volume effortlessly with concurrent conversations,
        reducing costs while maintaining fast response times.
      </p>
    </div>
  );
}

function Frame146() {
  return (
    <div className="content-stretch lg:flex gap-[20px] items-start relative shrink-0 w-full">
      <Frame147 />
      <div className="mt-2 lg:mt-0">
        <Frame148 />
      </div>
    </div>
  );
}

function Frame139() {
  return (
    <div className="content-stretch flex flex-col gap-6 sm:gap-[38px] items-start relative shrink-0 w-full">
      <Frame140 />
      <Frame143 />
      <Frame146 />
    </div>
  );
}

function Frame138() {
  return (
    <div className="content-stretch flex flex-col gap-6 sm:gap-[36px] items-center relative shrink-0 w-full max-w-[464px]">
      <p className="font-['Grift:Medium',sans-serif] leading-snug not-italic relative shrink-0 text-[#aaa] text-sm sm:text-base md:text-[18.5px] w-full whitespace-pre-wrap">
        <span className="leading-[normal] text-white">Instaflow</span>
        <span className="leading-[normal]">{` answers every call instantly with natural AI voice agents. Book appointments, handle support, and capture every lead. Scale effortlessly without extra staff, delays, or missed opportunities.`}</span>
      </p>
      <Frame139 />
    </div>
  );
}

function Frame136() {
  return (
    <div className="content-stretch lg:flex flex-col gap-6 sm:gap-[32px] items-center relative shrink-0 w-full md:flex-row md:items-start md:gap-[48px] lg:gap-[72px]">
      <Frame137 />
      <div className="mt-2 lg:mt-0">
        <Frame138 />
      </div>
    </div>
  );
}

function Frame131() {
  return (
    <div className="content-stretch flex flex-col gap-6 sm:gap-[32px] items-start relative mx-auto px-4 sm:px-6 md:gap-[40px] lg:gap-[49px] lg:px-0 w-full max-w-7xl">
      <Frame132 />
      <Frame136 />
    </div>
  );
}

export function Frame130() {
  return (
    <div
      className="relative overflow-hidden py-16 sm:py-20 md:py-28
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
          after:to-transparent "
    >
      <Frame131 />
    </div>
  );
}
