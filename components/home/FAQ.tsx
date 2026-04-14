const FAQS = [
  {
    q: "Will my callers know it's not a real person?",
    a: "No. We've tested this with hundreds of real calls. The voice uses natural pauses, filler words, and tone shifts \u2014 not a robotic script. Most callers don't notice, and many compliment how friendly your receptionist is.",
  },
  {
    q: "What happens to my existing phone number?",
    a: "You keep it. We forward calls behind the scenes when your staff can't pick up \u2014 busy, after hours, holidays. Your callers dial the same number they always have.",
  },
  {
    q: "How long does setup take?",
    a: "Most businesses are live within 1\u20132 weeks. We scrape your website, build your voice agent's knowledge base, and test it with real scenarios before going live. You approve everything first.",
  },
  {
    q: "What if it gets a question wrong?",
    a: "It only answers from your verified business info \u2014 services, hours, prices, policies. If a caller asks something outside that, it gracefully offers to take a message or have someone call them back. It never makes things up.",
  },
  {
    q: "What does it cost?",
    a: "Custom pricing based on your call volume. Most businesses pay less per month than one day of a part-time receptionist. Book a strategy call and we'll give you an exact number.",
  },
  {
    q: "What if I'm not happy with the results?",
    a: "Try it for 2 weeks. If you\u2019re not happy with the results, just let us know and we\u2019ll give you a full refund \u2014 no questions asked. We only win if you do.",
  },
];

export default function FAQ() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-center text-white/50 uppercase tracking-[3px] text-xs mb-4">
          Before You Decide
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-12">
          Questions We Get Asked Every Day
        </h2>
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <div
              key={faq.q}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 hover:bg-white/[0.06] transition-colors"
            >
              <p className="text-white font-semibold text-sm sm:text-base">{faq.q}</p>
              <p className="text-white/65 text-sm mt-2 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
