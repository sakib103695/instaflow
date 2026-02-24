import React from "react";

function Frame185() {
  return (
    <div className="content-stretch lg:flex lg:space-y-0 space-y-2 gap-[34px] items-center relative shrink-0">
      <p className="relative shrink-0">Privacy &amp; Policy</p>
      <p className="relative shrink-0">Terms &amp; Conditions</p>
      <p className="relative shrink-0">Contact Us</p>
    </div>
  );
}

function Frame184() {
  return (
    <div className="max-w-7xl mx-auto mt-6 sm:mt-8 md:mt-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 font-['Cottorway_Pro:Medium',sans-serif] leading-normal text-[#727272] text-xs sm:text-sm uppercase">
      <p className="shrink-0 text-center md:text-left">
        © 2026 InstaFlow AI. Strategy Calls Only. Custom Quoting.
      </p>
      <Frame185 />
    </div>
  );
}

export default function Footer() {
  return (
    <footer
      id="contact"
      className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 border-t border-white/5 bg-[#05010a]"
    >
      {/* Bottom row with links under logo on small screens */}
      <div className="md:hidden">
        <Frame184 />
      </div>

      {/* Large brand word strip under footer (from Instaflow design) */}
      <div className="mt-10 w-full overflow-hidden">
        <p
          className="
            text-center
            bg-clip-text font-bold bg-gradient-to-b 
            font-['Grift:Extra_Bold',sans-serif] 
            from-white/80 via-[#984de8] to-[rgba(42,20,77,0)]
            uppercase pointer-events-none select-none
            text-[60px] sm:text-[160px] md:text-[200px] lg:text-[257px] 
            leading-[1]
            tracking-[1px] sm:tracking-[2px] md:tracking-[3px] lg:tracking-[3px]
            opacity-60
          "
          style={{ WebkitTextFillColor: "transparent" }}
        >
          instaflow
        </p>
      </div>
    </footer>
  );
}
