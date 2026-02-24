import AnimatedIcon from './AnimatedIcon';

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 glass border-b border-white/5">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-950 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/40">
            <AnimatedIcon type="mic" className="w-6 h-6" />
          </div>
          <span className="text-2xl font-extrabold tracking-tighter bg-gradient-to-r from-white to-violet-400 bg-clip-text text-transparent">
            InstaFlow
          </span>
        </div>
        <div className="hidden md:flex gap-10 text-xs font-bold uppercase tracking-widest text-slate-400">
          <a href="#demo" className="hover:text-violet-400 transition-colors">
            Demo
          </a>
          <a href="#features" className="hover:text-violet-400 transition-colors">
            Features
          </a>
          <a href="#use-cases" className="hover:text-violet-400 transition-colors">
            Industries
          </a>
        </div>
        <a
          href="#demo"
          className="bg-violet-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-violet-500 transition-all shadow-lg shadow-violet-900/20"
        >
          Try Now
        </a>
      </nav>
    </header>
  );
}
