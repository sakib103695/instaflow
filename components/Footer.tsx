import React from "react";



function Frame185() {
  return (
    <div className="content-stretch lg:flex lg:space-y-0 space-y-2 gap-[34px] items-center relative shrink-0">
      <p className="relative shrink-0">{`Privacy & policy`}</p>
      <p className="relative shrink-0">{`Terms & conditions`}</p>
      <p className="relative shrink-0">contact us</p>
    </div>
  );
}

function Frame184() {
  return (
    <div className=" max-w-7xl px-3 lg:px-0 mx-auto mt-8 lg:flex font-['Cottorway_Pro:Medium',sans-serif] items-center justify-between leading-[normal] not-italic  shrink-0 text-[#727272] text-[12.741px] uppercase ">
      <p className=" shrink-0">© 2026 InstaFlow AI. Strategy Calls Only. Custom Quoting.</p>
      <div className="mt-4">
         <Frame185 />
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <div className="w-full relative bg-gradient-to-b from-black to-[#23003e] border border-[rgba(255,255,255,0.16)] rounded-[8px] py-[91px] overflow-hidden">
      {/* Top content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 items-end gap-6 px-4 lg:px-0 ">
        <div className="lg:flex flex-col justify-between">
          <div className="backdrop-blur-[1.905px] bg-[rgba(255,255,255,0.07)] h-[34px] rounded-[24.771px] flex items-center justify-center w-[300px] px-1">
            <p className="font-['Grift:Bold',sans-serif] text-[#c8c8c8] text-[14.291px] text-center uppercase">
              STAY UPDATED WITH INSTAFLOW NEWS
            </p>
          </div>
          <div
            className="bg-clip-text mt-4 lg:mt-4 bg-gradient-to-b from-white to-[#bababa] font-['Grift:Extra_Bold',sans-serif] font-bold leading-[46.555px] min-w-full text-[30px] lg:text-[40.75px] uppercase w-[min-content] whitespace-pre-wrap"
            style={{ WebkitTextFillColor: "transparent" }}
          >
            <p style={{ WebkitTextFillColor: "transparent" }} className="mb-0 ">{`STAY UPDATED WITH `}</p>
          </div>
            <p className="text-[#FFFFFF70] font-bold text-[30px] lg:text-[40.75px] uppercase ">INSTAFLOW NEWS</p>
        </div>
          <div className="flex justify-end">
            <div className="bg-[rgba(255,255,255,0.07)] border border-white/20  h-[58.608px] rounded-[36.524px] lg:w-[423px] flex items-center gap-2 justify-between px-3 md:pl-6 md:pr-2">
              <p className="font-['Cottorway_Pro:Medium',sans-serif] text-[#939393] text-[8px] lg:text-[12.741px] tracking-[0.5096px] uppercase">
                enter email address
              </p>
              <button className="bg-[#7711e5] py-2 md:py-2.5 cursor-pointer rounded-[22.084px] px-2 lg:px-5">
                <span className="font-['Cottorway_Pro:SemiBold',sans-serif] text-[12.741px] text-white tracking-[0.5096px] uppercase">
                  subscribe now
                </span>
              </button>
            </div>
          </div>
    
      </div>
       <div className="md:h-[40vh] h-[30vh] mt-4">
         <div >
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1440.01 1">
            <line id="Line 2" stroke="var(--stroke-0, #2F2F2F)" strokeOpacity="0.58" x2="1440.01" y1="0.5" y2="0.5" />
          </svg>
        </div>
        <Frame184 />
       </div>
      {/* Bottom text */}
    <p
  className="
    absolute bottom-0 left-1/2 -translate-x-1/2
    bg-clip-text font-bold bg-gradient-to-b 
    font-['Grift:Extra_Bold',sans-serif] 
    from-white/80 via-[#984de8] to-[rgba(42,20,77,0)]
    uppercase pointer-events-none select-none
    text-[60px] sm:text-[160px] md:text-[200px] lg:text-[257px] 
    leading-[1] sm:leading-[1] md:leading-[1] lg:leading-[1] 
    tracking-[1px] sm:tracking-[2px] md:tracking-[3px] lg:tracking-[3px]
    opacity-60
  "
  style={{ WebkitTextFillColor: "transparent" }}
>
  instaflow
</p>
    </div>
  );
}
