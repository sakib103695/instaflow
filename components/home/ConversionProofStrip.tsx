import React from "react";

const items = [
  { value: "12", label: "Bookings recovered in the first month" },
  { value: "95%", label: "Callers thought it was a real person" },
  { value: "10-15", label: "Extra appointments booked every month" },
];

export default function ConversionProofStrip() {
  return (
    <section className="px-4 sm:px-6 -mt-2 mb-8 sm:mb-10">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-4 text-center"
          >
            <p className="text-2xl sm:text-3xl font-extrabold text-yellow-300">{item.value}</p>
            <p className="text-white/80 text-xs sm:text-sm">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
