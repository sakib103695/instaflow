export default function FinalCTA() {
  return (
    <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-[linear-gradient(135deg,#3c35d3,#5c54e8)] text-white">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-white/70 uppercase tracking-[3px] text-xs mb-4">
          One Last Thing
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
          Every Call You Miss Today<br className="hidden sm:block" /> Is a Booking Your Competitor Gets
        </h2>
        <p className="mt-5 text-base sm:text-lg text-white/85 max-w-2xl mx-auto leading-relaxed">
          You already heard the demo. You already saw the numbers. The only
          question left is how many more calls you want to lose before you
          fix this.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="#hero"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-[#3c35d3] font-bold uppercase text-sm sm:text-base hover:bg-white/95 transition-colors shadow-xl"
          >
            Try It Again
          </a>
          <a
            href="#calculator"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/50 text-white font-bold uppercase text-sm sm:text-base hover:bg-white/10 transition-colors"
          >
            See Your Numbers
          </a>
        </div>

        <div className="mt-8 inline-block rounded-lg bg-white/10 px-5 py-3">
          <p className="text-sm text-white/90">
            We onboard a limited number of businesses each month so we can
            set each one up properly.{" "}
            <span className="font-semibold text-white">
              If you&apos;re reading this, there&apos;s still a spot open.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
