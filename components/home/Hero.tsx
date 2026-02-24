"use client";
import React from "react";
import svgPaths from "@/public/assets/data/svgPaths";
import { MessageCircle, Mic } from "lucide-react";
import { useVoiceAgent } from "@/hooks/useVoiceAgent";
import { AVAILABLE_VOICES } from "@/constants";
/* ================= BACKGROUND LAYER: blur columns + starry ================= */
function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <img
        src="/assets/hero-images/hero-gradient.svg"
        alt=""
        className="w-full h-full object-cover xl:object-contain"
      />
    </div>
  );
}

/* ================= HERO TITLE + SUBTITLE ================= */
function HeroHeadline() {
  return (
    <div className="flex flex-col items-center gap-4 text-center max-w-[640px] px-4 relative z-10">
      <div className="font-['Grift:Extra_Bold',sans-serif] mt-8 text-center not-italic text-[24px] sm:text-[38px] md:text-[42.755px] leading-[1.1] uppercase">
        <p
          className="bg-clip-text font-bold bg-gradient-to-b from-white to-[#bababa]"
          style={{ WebkitTextFillColor: "transparent" }}
        >
          Every Call
        </p>
        <p
          className="bg-clip-text mx-auto font-bold bg-gradient-to-b from-white to-[#bababa] w-full whitespace-pre-wrap"
          style={{ WebkitTextFillColor: "transparent" }}
        >
          Answered{" "}
          <span className="bg-clip-text bg-gradient-to-b from-[#f5ebff] to-[#ba79ff] text-transparent">
            Instantly
          </span>
        </p>
      </div>
      <p className="text-[#c8c8c8] text-sm sm:text-[15px] leading-relaxed max-w-[560px]">
        Scale your business with human-sounding AI voice agents. Pick up every
        lead, handle complex support, and never leave a customer hanging.
      </p>
    </div>
  );
}

/* ================= DROPDOWN ARROW (original design) ================= */
function ArrowDown() {
  return (
    <svg
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 21.6 21.6"
      className="shrink-0"
    >
      <path
        d={svgPaths.p2089ff50}
        stroke="#D0D0D0"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ================= CENTRAL MIC + VOICE BARS (original design) ================= */
function CentralMic() {
  return (
    <div className="relative shrink-0 size-[72px]">
      <svg className="block size-full" fill="none" viewBox="0 0 72 72">
        <circle
          cx="36"
          cy="36"
          r="35"
          fill="white"
          fillOpacity="0.06"
          stroke="white"
          strokeOpacity="0.1"
          strokeWidth="0.7"
        />
        <g>
          <path d={svgPaths.p1df84f80} stroke="white" strokeWidth="1.78" />
          <path
            d={svgPaths.p25e17200}
            stroke="white"
            strokeLinecap="round"
            strokeWidth="1.78"
          />
          <path
            d={svgPaths.p1f89b300}
            stroke="white"
            strokeLinecap="round"
            strokeWidth="1.78"
          />
        </g>
      </svg>
    </div>
  );
}

/* Static voice bar (used when not active) */
function VoiceBar() {
  return (
    <svg
      className="size-[45px] shrink-0 opacity-70"
      fill="none"
      viewBox="0 0 45 45"
    >
      <path
        d={svgPaths.p702a680}
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.56"
      />
    </svg>
  );
}

/* Animated voice-level bars (like recording apps) when call is active */
function VoiceLevelBars({ isActive }: { isActive: boolean }) {
  const bars = 12;
  if (!isActive) return null;
  return (
    <div
      className="flex items-center justify-center gap-0.5 h-12 shrink-0"
      aria-hidden
    >
      {[...Array(bars)].map((_, i) => (
        <div
          key={i}
          className="w-1 bg-[#8c21ff] rounded-full min-h-[4px] animate-voice-bar"
          style={{
            animationDelay: `${i * 0.05}s`,
            height: `${28 + Math.sin(i * 0.8) * 12}px`,
          }}
        />
      ))}
    </div>
  );
}

/* ================= MAIN GLASS CARD (original design + functionality) ================= */
interface HeroCardProps {
  selectedVoice: (typeof AVAILABLE_VOICES)[0];
  setSelectedVoice: (v: (typeof AVAILABLE_VOICES)[0]) => void;
  isActive: boolean;
  isConnecting: boolean;
  isPreviewing: boolean;
  error: string | null;
  transcription: { role: 'user' | 'agent'; text: string }[];
  previewVoice: () => void;
  startConversation: () => void;
  stopConversation: () => void;
}

function HeroCard({
  selectedVoice,
  setSelectedVoice,
  isActive,
  isConnecting,
  isPreviewing,
  error,
  transcription,
  previewVoice,
  startConversation,
  stopConversation,
}: HeroCardProps) {
  return (
    <div className="relative w-full max-w-[560px] min-w-0 rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 overflow-hidden border border-white/10 backdrop-blur-xl shadow-[inset_0_1px_40px_0_rgba(227,222,255,0.2),inset_0_0_56px_-36px_rgba(255,255,255,0.5)] bg-white/[0.06]">
      <div className="absolute inset-0 pointer-events-none bg-[#CD9EFF]/10 blur-[80px] rounded-full w-32 h-32 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2" />
      <p className="text-center text-base sm:text-lg md:text-[22px] uppercase font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white to-[#8D23FF] relative z-10">
        Call & Test the AI Agent Now
      </p>
      <div className="relative z-10 w-full flex justify-center">
        <img
          src="/assets/icons/curved-line.svg"
          alt="divider"
          className="w-full max-w-full opacity-80"
        />
      </div>
      {error && (
        <div className="rounded-xl bg-red-500/20 border border-red-500/40 px-4 py-2 text-red-200 text-sm relative z-10">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 relative z-10">
        <p className="text-[#7e8faa] text-xs uppercase tracking-widest">
          Select Voice Agent Profile
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-0 sm:min-w-[200px] relative">
            <select
              disabled={isActive || isConnecting}
              value={selectedVoice.id}
              onChange={(e) => {
                const v = AVAILABLE_VOICES.find((x) => x.id === e.target.value);
                if (v) setSelectedVoice(v);
              }}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#8c21ff] cursor-pointer appearance-none pr-10"
            >
              {AVAILABLE_VOICES.map((v) => (
                <option
                  key={v.id}
                  value={v.id}
                  className="bg-[#1a0a2e] text-white"
                >
                  {v.label}
                </option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <ArrowDown />
            </span>
          </div>
          <button
            type="button"
            onClick={previewVoice}
            disabled={isActive || isConnecting || isPreviewing}
            className="shrink-0 bg-[#8c21ff] hover:bg-[#7a1ae6] disabled:opacity-50 rounded-lg h-10 px-5 flex items-center justify-center gap-2 transition-colors"
          >
            {isPreviewing ? (
              <span className="size-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
            ) : (
              <img
                src="/assets/icons/play-icon.svg"
                alt="Play"
                className="w-4 h-4 object-contain"
              />
            )}
            <span className="text-white text-xs font-semibold uppercase tracking-wide">
              Preview
            </span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-4 py-2 relative z-10">
        {isActive ? <VoiceLevelBars isActive={true} /> : <VoiceBar />}
        <button
          type="button"
          onClick={() => !isActive && !isConnecting && startConversation()}
          disabled={isConnecting}
          className={`relative size-[72px] sm:size-[85px] rounded-full bg-white/5 border flex items-center justify-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c21ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0312] disabled:opacity-50 disabled:cursor-not-allowed ${
            isActive
              ? "border-[#8c21ff]/60 shadow-[0_0_24px_rgba(140,33,255,0.4)] cursor-default"
              : "border-white/20 cursor-pointer hover:border-[#8c21ff]/40 hover:shadow-[0_0_20px_rgba(140,33,255,0.25)] animate-mic-pulse"
          }`}
          aria-label={isActive ? "Call in progress" : "Start conversation"}
        >
          <div
            className={`absolute inset-0 rounded-full blur-2xl transition-opacity ${isActive ? "bg-[#CD9EFF]/40" : "bg-[#CD9EFF]/30"}`}
          />
          <CentralMic />
        </button>
        {isActive ? <VoiceLevelBars isActive={true} /> : <VoiceBar />}
      </div>
      {/* 
      <div className="flex justify-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 text-[#c8c8c8] text-xs sm:text-sm">
          <svg className="size-[19px]" fill="none" viewBox="0 0 18.9 18.9">
            <path d={svgPaths.p1f705200} stroke="#AAAAAA" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.9" />
            <path d={svgPaths.p28afb700} stroke="#AAAAAA" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.9" />
            <path d={svgPaths.p3dae2000} stroke="#AAAAAA" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.9" />
            <path d={svgPaths.p917b000} stroke="#AAAAAA" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.9" />
          </svg>
          Business & Consulting
        </div>
      </div> */}

      {!isActive ? (
        <button
          type="button"
          onClick={startConversation}
          disabled={isConnecting}
          className="w-full py-3.5 rounded-xl bg-white text-[#0e041a] font-bold text-sm uppercase flex items-center justify-center gap-2 hover:bg-white/95 transition-colors relative z-10 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <>
              <span className="size-5 border-2 border-[#0e041a] border-t-transparent rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <MessageCircle className="size-5" />
              Talk to Professional
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={stopConversation}
          className="w-full py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm uppercase flex items-center justify-center gap-2 transition-colors relative z-10 border border-red-400/50"
        >
          End conversation
        </button>
      )}

      {isActive && transcription.length > 0 && (
        <div className="transcription-scroll relative z-10 pt-4 border-t border-white/10 space-y-2 max-h-40 overflow-y-auto">
          {transcription.slice(-8).map((entry, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl text-sm ${
                entry.role === 'agent'
                  ? "bg-[#8c21ff]/20 border border-[#8c21ff]/30 text-left"
                  : "bg-white/10 border border-white/20 text-right ml-6"
              }`}
            >
              <p className="text-white/70 text-xs font-medium mb-0.5">
                {entry.role === 'agent' ? selectedVoice.label : 'You'}
              </p>
              <p className="text-white/90 leading-snug">{entry.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= LEFT: AI WELCOME BUBBLE ================= */
function LeftBubble() {
  return (
    <div className="absolute left-[5%] top-[42%] md:left-[8%] md:top-[38%] w-[240px] md:w-[350px] z-20 hidden lg:block">
      <img
        src="/assets/hero-images/hero-left-side-chatboat.png"
        alt=""
        className="size-full object-cover"
      />
    </div>
  );
}

/* ================= RIGHT: USER BUBBLE ================= */
function RightBubble() {
  return (
    <div className="absolute right-[5%] top-[28%] md:right-[8%] md:top-[24%] w-[240px] md:w-[350px] z-20 hidden lg:block">
      <img
        src="/assets/hero-images/hero-right-side-chat-reply-image.png"
        alt=""
        className="size-full object-cover"
      />

      <div className="absolute -right-4 top-1/2 w-8 border-t border-dashed border-white/30" />
    </div>
  );
}

/* ================= COMBINED HERO ================= */
export function Hero() {
  const {
    isActive,
    isConnecting,
    isPreviewing,
    error,
    transcription,
    selectedVoice,
    setSelectedVoice,
    previewVoice,
    startConversation,
    stopConversation,
  } = useVoiceAgent();

  return (
    <section
      id="hero"
      className="relative w-full flex flex-col items-center pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-10 sm:pb-14 md:pb-20 px-4 sm:px-6 bg-[#0A0312] scroll-mt-24 sm:scroll-mt-28"
    >
      <HeroBackground />
      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-4xl">
        <HeroHeadline />
        <HeroCard
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          isActive={isActive}
          isConnecting={isConnecting}
          isPreviewing={isPreviewing}
          error={error}
          transcription={transcription}
          previewVoice={previewVoice}
          startConversation={startConversation}
          stopConversation={stopConversation}
        />
      </div>
      <LeftBubble />
      <RightBubble />
    </section>
  );
}
