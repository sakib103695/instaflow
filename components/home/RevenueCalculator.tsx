"use client";

import { useMemo, useState } from "react";

export default function RevenueCalculator() {
  const [callsPerDay, setCallsPerDay] = useState(30);
  const [voicemailRate, setVoicemailRate] = useState(35);
  const [avgServicePrice, setAvgServicePrice] = useState(500);

  const result = useMemo(() => {
    const missedPerDay = callsPerDay * (voicemailRate / 100);
    const missedPerMonth = Math.round(missedPerDay * 30);
    const conversionRate = 0.3;
    const monthlyLoss = Math.round(missedPerMonth * conversionRate * avgServicePrice);
    const yearlyLoss = monthlyLoss * 12;
    return { missedPerMonth, monthlyLoss, yearlyLoss };
  }, [callsPerDay, voicemailRate, avgServicePrice]);

  return (
    <section id="calculator" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
          How Much Are You Really Losing?
        </h2>
        <p className="text-white/70 text-base sm:text-lg mt-3 mb-10">
          Spas, med spas, and salons often don’t know how much revenue they lose
          when calls go to voicemail. Use the numbers below to see your estimate.
        </p>
      </div>

      <div className="max-w-4xl mx-auto rounded-2xl border border-[#8c21ff]/30 bg-[linear-gradient(135deg,#120824_0%,#0d0618_100%)] p-6 sm:p-8 md:p-10">
        <div className="space-y-6">
          <label className="block text-left">
            <span className="text-white text-sm sm:text-base font-semibold">
              How many calls do you get per day?
            </span>
            <input
              type="range"
              min={10}
              max={100}
              value={callsPerDay}
              onChange={(e) => setCallsPerDay(Number(e.target.value))}
              className="mt-3 w-full accent-[#8c21ff]"
            />
            <div className="text-right text-[#b8a0ff] font-bold mt-1">{callsPerDay} calls/day</div>
          </label>

          <label className="block text-left">
            <span className="text-white text-sm sm:text-base font-semibold">
              What % of calls go to voicemail? (typical: 30–40%)
            </span>
            <input
              type="range"
              min={20}
              max={60}
              value={voicemailRate}
              onChange={(e) => setVoicemailRate(Number(e.target.value))}
              className="mt-3 w-full accent-[#8c21ff]"
            />
            <div className="text-right text-[#b8a0ff] font-bold mt-1">{voicemailRate}%</div>
          </label>

          <label className="block text-left">
            <span className="text-white text-sm sm:text-base font-semibold">
              Your average service or appointment value ($)
            </span>
            <input
              type="number"
              min={100}
              max={2000}
              value={avgServicePrice}
              onChange={(e) => setAvgServicePrice(Number(e.target.value) || 0)}
              className="mt-3 w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white"
            />
          </label>
        </div>

        <div className="mt-8 rounded-xl bg-[#8c21ff]/20 border border-[#8c21ff]/40 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
            <div>
              <p className="text-white/80 text-sm uppercase">Calls missed per month</p>
              <p className="mt-1 text-3xl sm:text-4xl font-extrabold text-white">{result.missedPerMonth}</p>
            </div>
            <div>
              <p className="text-white/80 text-sm uppercase">Revenue lost per month</p>
              <p className="mt-1 text-3xl sm:text-4xl font-extrabold text-white">
                ${result.monthlyLoss.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-white/80 text-sm uppercase">Revenue lost per year</p>
              <p className="mt-1 text-4xl sm:text-5xl font-extrabold text-yellow-300">
                ${result.yearlyLoss.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-6 text-center">
            <a
              href="#hero"
              className="inline-block bg-white text-[#4b14a1] px-6 py-3 rounded-lg font-bold uppercase text-sm"
            >
              Stop Losing Money — Try Demo Now
            </a>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-white/15 bg-white/5 p-4">
            <p className="text-white text-sm font-semibold mb-1">Will it sound robotic?</p>
            <p className="text-white/70 text-xs">
              No. You get a natural, conversational voice built for front-desk and booking calls.
            </p>
          </div>
          <div className="rounded-lg border border-white/15 bg-white/5 p-4">
            <p className="text-white text-sm font-semibold mb-1">How long until we’re live?</p>
            <p className="text-white/70 text-xs">
              Most businesses are live in 1–2 weeks, including your script and call flow.
            </p>
          </div>
          <div className="rounded-lg border border-white/15 bg-white/5 p-4">
            <p className="text-white text-sm font-semibold mb-1">What if we don’t see results?</p>
            <p className="text-white/70 text-xs">
              Start with a risk-free trial. You only keep it if you see more booked appointments.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
