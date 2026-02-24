"use client";
import { AVAILABLE_VOICES } from '../constants';
import { useVoiceAgent } from '../hooks/useVoiceAgent';
import AudioVisualizer from './AudioVisualizer';

export default function VoiceDemo() {
  const {
    isActive,
    isConnecting,
    isPreviewing,
    isAiSpeaking,
    transcription,
    selectedVoice,
    setSelectedVoice,
    previewVoice,
    startConversation,
    stopConversation,
  } = useVoiceAgent();

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
          <div className="flex items-end">
            <button
              onClick={previewVoice}
              disabled={isActive || isConnecting || isPreviewing}
              className="h-[54px] px-6 rounded-2xl border border-violet-500/30 text-violet-400 font-bold hover:bg-violet-500/10 transition-all flex items-center gap-2 disabled:opacity-30 shadow-lg"
            >
              {isPreviewing ? (
                <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent animate-spin rounded-full" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              Preview
            </button>
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
              onClick={stopConversation}
              className="flex items-center gap-4 bg-red-500 hover:bg-red-600 text-white px-12 py-6 rounded-full font-black text-lg transition-all shadow-xl active:scale-95 animate-pulse"
            >
              End Conversation
            </button>
          )}
        </div>
      </div>

      {isActive && transcription.length > 0 && (
        <div className="mt-16 pt-10 border-t border-white/5">
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
            {transcription.map((entry, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border ${
                  entry.role === 'agent'
                    ? 'bg-violet-600/10 border-violet-500/20 mr-6 text-left'
                    : 'bg-white/10 border-white/20 ml-6 text-right'
                }`}
              >
                <p className="text-xs text-slate-400 font-semibold mb-1">
                  {entry.role === 'agent' ? selectedVoice.label : 'You'}
                </p>
                <p className="text-sm text-slate-300 font-medium leading-relaxed">{entry.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
