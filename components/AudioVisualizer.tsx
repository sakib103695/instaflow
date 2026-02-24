"use client";
import React, { useEffect, useState } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  isSpeaking: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, isSpeaking }) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!isActive) {
      setScale(1);
      return;
    }

    let animationFrame: number;
    const animate = () => {
      const targetScale = isSpeaking ? 1.1 + Math.random() * 0.4 : 1 + Math.random() * 0.05;
      setScale(prev => prev + (targetScale - prev) * 0.2);
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isActive, isSpeaking]);

  return (
    <div className="relative flex items-center justify-center w-56 h-56">
      {/* Outer Glows */}
      <div 
        className={`absolute inset-0 rounded-full transition-all duration-700 blur-3xl opacity-20 bg-violet-600 ${isActive ? 'scale-125' : 'scale-0'}`}
      />
      <div 
        className={`absolute inset-0 rounded-full transition-all duration-700 blur-2xl opacity-40 bg-indigo-500 ${isActive ? 'scale-110' : 'scale-0'}`}
      />
      
      {/* Main Pulse Circle */}
      <div 
        style={{ transform: `scale(${scale})` }}
        className={`relative w-36 h-36 rounded-full border-4 flex items-center justify-center transition-all duration-500 shadow-2xl
          ${isActive ? 'bg-violet-600 border-violet-400 text-white shadow-violet-900/40' : 'bg-white/5 border-white/10 text-slate-500'}`}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" viewBox="0 0 24 24" 
          strokeWidth={1.5} 
          stroke="currentColor" 
          className={`w-14 h-14 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}
        >
          {isActive ? (
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.287a6 6 0 0 1 0 7.427M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
          )}
        </svg>
      </div>

      {/* Ripple Animation */}
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className="absolute w-full h-full rounded-full border border-violet-500 opacity-20 animate-ping"
              style={{ animationDelay: `${i * 0.4}s`, animationDuration: '2s' }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AudioVisualizer;
