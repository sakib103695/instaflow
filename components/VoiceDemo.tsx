"use client";
import { AVAILABLE_VOICES, INSTAFLOW_SYSTEM_INSTRUCTION } from '../constants';
import { useVapiAgent } from '../hooks/useVapiAgent';
import AudioVisualizer from './AudioVisualizer';

const DEMO_GREETING = "Hi, thanks for calling GlowLift Medspa — this is Mia, how can I help you today?";

export default function VoiceDemo() {
  const {
    isActive,
    isConnecting,
    isAiSpeaking,
    selectedVoice,
    setSelectedVoice,
    startConversation,
    stopConversation,
  } = useVapiAgent({
    systemInstruction: INSTAFLOW_SYSTEM_INSTRUCTION,
    greeting: DEMO_GREETING,
  });

  return (
    <div
      id="demo"
      className="scroll-mt-32 glass rounded-[3.5rem] p-8 md:p-16 border border-white/10 max-w-4xl mx-auto mb-32 relative overflow-hidden shadow-3xl"
    >
      <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 blur-[120px] -z-10 rounded-full" />

      <div className="flex flex-col items-center">
        <h2 className="text-3xl font-bold mb-8 text-white">Experience InstaFlow</h2>

        {/* Dropdown Voice Selector & Preview Button */}
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-md mb-12 text-left">
          <div className="flex-grow">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
              Select Voice Agent Profile
            </label>
            <div className="relative">
              <select
                disabled={isActive || isConnecting}
                value={selectedVoice.id}
                onChange={(e) =>
                  setSelectedVoice(AVAILABLE_VOICES.find((v) => v.id === e.target.value)!)
                }
                className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-5 py-3.5 outline-none focus:border-violet-500 transition-all appearance-none cursor-pointer font-medium"
              >
                {AVAILABLE_VOICES.map((v) => (
                  <option key={v.id} value={v.id} className="bg-slate-900">
                    {v.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <AudioVisualizer isActive={isActive} isSpeaking={isAiSpeaking} />

        <div className="mt-8 text-center h-16 flex items-center justify-center">
          {isConnecting ? (
            <p className="text-violet-400 font-black animate-pulse tracking-widest text-sm uppercase">
              Securely Connecting to AI Node...
            </p>
          ) : isActive ? (
            <p className="text-slate-200 max-w-sm italic font-medium leading-relaxed">
              &quot;System Online. Talk to me like a real person. I&apos;m listening.&quot;
            </p>
          ) : (
            <p className="text-slate-500 text-sm font-medium">{selectedVoice.description}</p>
          )}
        </div>

        <div className="mt-10">
          {!isActive ? (
            <button
              onClick={startConversation}
              disabled={isConnecting}
              className="group flex items-center gap-4 bg-white text-black px-12 py-6 rounded-full font-black text-lg transition-all hover:scale-105 shadow-2xl hover:shadow-white/10 active:scale-95 disabled:opacity-50"
            >
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                  <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.75 6.75 0 1 1-13.5 0v-1.5a.75.75 0 0 1 .75-.75Z" />
                  <path d="M12 18.75a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V19.5a.75.75 0 0 1 .75-.75Z" />
                </svg>
              </div>
              Talk to {selectedVoice.label.split(' ')[0]}
            </button>
          ) : (
            <button
              onClick={() => stopConversation()}
              className="flex items-center gap-4 bg-red-500 hover:bg-red-600 text-white px-12 py-6 rounded-full font-black text-lg transition-all shadow-xl active:scale-95 animate-pulse"
            >
              End Conversation
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
