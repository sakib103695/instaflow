import React from "react";

export default function FinalCTA() {
  return (
    <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-[linear-gradient(135deg,#3c35d3,#5c54e8)] text-white">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold">
          Stop Losing Bookings to Voicemail
        </h2>
        <p className="mt-4 text-base sm:text-lg text-white/90 max-w-3xl mx-auto">
          Every week you wait, more callers hang up or go to a competitor. Businesses
          using InstaFlow answer every call and fill more appointments—without
          extra staff.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#hero"
            className="inline-block px-6 py-3 rounded-xl bg-white text-[#3c35d3] font-bold uppercase text-sm sm:text-base"
          >
            Try the Demo Now
          </a>
          <a
            href="#calculator"
            className="inline-block px-6 py-3 rounded-xl border border-white/50 text-white font-bold uppercase text-sm sm:text-base"
          >
            See Your Revenue Loss
          </a>
        </div>

        <p className="mt-6 text-sm text-white/90">
          14-day trial. Full refund if you don’t recover at least 5 bookings in your first month.
        </p>
        <p className="mt-3 text-xs sm:text-sm bg-white/10 inline-block px-4 py-2 rounded-md">
          We onboard a limited number of businesses each month—spots fill quickly.
        </p>
      </div>
    </section>
  );
}
