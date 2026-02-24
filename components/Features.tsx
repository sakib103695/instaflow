import AnimatedIcon from './AnimatedIcon';

const FEATURES = [
  {
    type: 'target',
    title: 'Context Aware',
    desc: 'Our agents understand nuance, sarcasm, and intent, providing a genuinely human experience.',
  },
  {
    type: 'bolt',
    title: 'Instant Pickup',
    desc: 'No robotic pauses. Handle unlimited concurrent calls with sub-second response times.',
  },
  {
    type: 'globe',
    title: 'Global Reach',
    desc: 'Speak to customers in 50+ languages with localized cultural understanding and perfect accents.',
  },
  {
    type: 'shield',
    title: 'Private & Secure',
    desc: 'Bank-level encryption and SOC 2 compliance ensure your customer data is always protected.',
  },
  {
    type: 'chart',
    title: 'Deep Data',
    desc: 'Automatically transcribe and sync conversation data and sentiment to your existing CRM.',
  },
  {
    type: 'sync',
    title: 'Easy Integration',
    desc: 'Plug into Salesforce, Hubspot, Zendesk and 2000+ other apps in minutes.',
  },
] as const;

export default function Features() {
  return (
    <section id="features" className="py-32 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className="glass p-10 rounded-[3rem] border border-white/5 hover:border-violet-500/20 transition-all group"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-900 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-2xl">
              <AnimatedIcon type={f.type} className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">{f.title}</h3>
            <p className="text-slate-400 leading-relaxed font-medium">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
