"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";

function numberInput(value: number, setValue: (n: number) => void) {
  return {
    value,
    onChange: (e: ChangeEvent<HTMLInputElement>) =>
      setValue(Number(e.target.value) || 0),
  };
}

export default function CalculatorPage() {
  const [callsPerDay, setCallsPerDay] = useState(30);
  const [voicemailRate, setVoicemailRate] = useState(35);
  const [avgTicket, setAvgTicket] = useState(500);

  const result = useMemo(() => {
    const missedCalls = Math.round(callsPerDay * 30 * (voicemailRate / 100));
    const conversionRate = 0.3;
    const monthlyLoss = missedCalls * conversionRate * avgTicket;
    const yearlyLoss = monthlyLoss * 12;
    return {
      missedCalls,
      monthlyLoss,
      yearlyLoss,
    };
  }, [callsPerDay, voicemailRate, avgTicket]);

  return (
    <main className="min-h-screen bg-[#0A0312] text-white px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-4xl font-bold uppercase">
            How Much Are You Really Losing?
          </h1>
          <Link href="/" className="text-sm text-white/80 hover:text-white">
            Back to Home
          </Link>
        </div>

        <p className="text-white/75 max-w-3xl mb-8">
          Most businesses have no idea how much revenue walks away every month
          when calls go to voicemail.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-lg uppercase font-semibold">Calculator Inputs</h2>

            <label className="block text-sm">
              <span className="text-white/80">How many calls do you get per day?</span>
              <input
                type="number"
                className="mt-1 w-full rounded-lg bg-[#140923] border border-white/10 px-3 py-2"
                {...numberInput(callsPerDay, setCallsPerDay)}
              />
            </label>

            <label className="block text-sm">
              <span className="text-white/80">What % goes to voicemail?</span>
              <input
                type="number"
                className="mt-1 w-full rounded-lg bg-[#140923] border border-white/10 px-3 py-2"
                {...numberInput(voicemailRate, setVoicemailRate)}
              />
            </label>

            <label className="block text-sm">
              <span className="text-white/80">Average service price ($)</span>
              <input
                type="number"
                className="mt-1 w-full rounded-lg bg-[#140923] border border-white/10 px-3 py-2"
                {...numberInput(avgTicket, setAvgTicket)}
              />
            </label>
            <p className="text-xs text-white/60">
              Assumes 30% of missed calls would have converted into bookings.
            </p>
          </section>

          <section className="rounded-2xl border border-[#8D23FF]/40 bg-[#8D23FF]/10 p-6 space-y-5">
            <h2 className="text-lg uppercase font-semibold">Estimated Revenue Loss</h2>
            <div className="text-white/85 space-y-2">
              <p>Missed calls per month: <strong>{result.missedCalls}</strong></p>
            </div>

            <div className="rounded-xl bg-[#10051c] border border-white/10 p-4">
              <p className="text-sm text-white/70 uppercase">Revenue Lost Per Month</p>
              <p className="text-3xl font-bold text-yellow-300">
                ${result.monthlyLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="rounded-xl bg-[#10051c] border border-white/10 p-4">
              <p className="text-sm text-white/70 uppercase">Revenue Lost Per Year</p>
              <p className="text-3xl font-bold text-yellow-300">
                ${result.yearlyLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>

            <p className="text-xs text-white/60">
              This is an estimate for sales planning only. Actual results vary by
              offer quality, response speed, and lead source.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
