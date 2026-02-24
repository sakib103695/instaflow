import AnimatedIcon from './AnimatedIcon';

const INDUSTRIES = [
  {
    type: 'hospital',
    title: 'Healthcare',
    desc: 'Appointment scheduling and patient follow-ups with empathy.',
  },
  {
    type: 'shopping',
    title: 'E-commerce',
    desc: 'Order tracking and returns processed instantly 24/7.',
  },
  {
    type: 'bank',
    title: 'Fintech',
    desc: 'Secure account queries and fraud alert automation.',
  },
  {
    type: 'hotel',
    title: 'Hospitality',
    desc: 'Reservations and concierge services for global guests.',
  },
  {
    type: 'car',
    title: 'Automotive',
    desc: 'Service reminders and test drive bookings seamlessly.',
  },
  {
    type: 'book',
    title: 'Education',
    desc: 'Student enrollment and administrative support flows.',
  },
] as const;

export default function Industries() {
  return (
    <section id="use-cases" className="py-32 px-6 bg-white/[0.01]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Built for Every Vertical</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium">
            InstaFlow adapts its tone and knowledge to match your industry standards perfectly.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {INDUSTRIES.map((u, i) => (
            <div
              key={i}
              className="p-8 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex items-start gap-6"
            >
              <div className="shrink-0 w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center text-violet-400">
                <AnimatedIcon type={u.type} className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">{u.title}</h4>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">{u.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
