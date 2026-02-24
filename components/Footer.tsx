export default function Footer() {
  return (
    <footer id="contact" className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 border-t border-white/5 bg-[#05010a]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8 md:gap-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center text-black font-black text-sm sm:text-base">
            I
          </div>
          <span className="text-lg sm:text-xl font-bold">InstaFlow</span>
        </div>
        <div className="text-slate-500 text-xs sm:text-sm font-medium text-center md:text-left">
          © 2026 InstaFlow AI. Strategy Calls Only. Custom Quoting.
        </div>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">
          <a href="#" className="hover:text-white transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Terms
          </a>
          <a href="mailto:hello@instaflow.ai" className="hover:text-white transition-colors">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
