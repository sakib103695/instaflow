import React from "react";
const LEFT_ICON_SRC = "/assets/icons/left.svg";
const RIGHT_ICON_SRC = "/assets/icons/right.svg";

function Badge() {
  return (
    <div className="sm:flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      <img src={LEFT_ICON_SRC} alt="" className="h-[24px] mx-auto w-[60px] sm:h-[30px] sm:w-[80px] md:w-[100px] lg:w-[135px]" />
      <p className="text-white uppercase tracking-[2px] text-[12px] sm:text-[16px]">
        SEAMLESS CONNECTIONS
      </p>
      <img src={RIGHT_ICON_SRC} alt="" className="h-[24px] mx-auto w-[60px] sm:h-[30px] sm:w-[80px] md:w-[100px] lg:w-[135px]" />
    </div>
  );
}

function Heading() {
  return (
    <div className="text-center uppercase w-full max-w-[505px] mx-auto px-2">
      <p
        className="bg-clip-text font-bold bg-gradient-to-b from-white to-[#bababa] text-[20px] sm:text-[24px] md:text-[32px] lg:text-[40px] leading-tight md:leading-[46.555px]"
        style={{ WebkitTextFillColor: "transparent" }}
      >
        Integrations That
      </p>
      <p
        className="bg-clip-text mt-1 font-bold bg-gradient-to-b from-white to-[#bababa] text-[20px] sm:text-[24px] md:text-[32px] lg:text-[40.75px] leading-tight md:leading-[46.555px]"
        style={{ WebkitTextFillColor: "transparent" }}
      >
        Fit Your Workflow
      </p>
    </div>
  );
}

export function WorkflowHeading() {
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 py-8 sm:py-12 md:py-16 md:pt-28 text-center">
      <div className="flex flex-col items-center gap-3 sm:gap-4 w-full">
        <Badge />
        <Heading />
      </div>

      <p className="font-['Grift:Medium',sans-serif] text-base sm:text-lg leading-relaxed text-white max-w-[569px] px-2">
        Connect Instaflow with your existing tools for payments, scheduling,
        CRM, and social platforms. If there’s an open API, we’ll build and
        manage the integration for you.
      </p>
    </div>
  );
}
