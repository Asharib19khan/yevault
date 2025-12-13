
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useMirrorBrain } from '@/hooks/useMirrorBrain';
import { HUDOverlay } from '@/components/HUDOverlay';

const VisionConfig = dynamic(() => import('@/components/VisionConfig'), { ssr: false });
const AIAvatar = dynamic(() => import('@/components/AIAvatar'), { ssr: false });

export default function Home() {
  const { isSpeaking, isListening, transcript, startListening } = useMirrorBrain();
  const [started, setStarted] = useState(false);
  const [booting, setBooting] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  const handleStart = () => {
    setBooting(true);
    // Simulate Boot Sequence
    setTimeout(() => {
      setBooting(false);
      setStarted(true);
      startListening();
    }, 2000); // 2s boot time
  };

  return (
    <main className="flex h-screen w-screen bg-black overflow-hidden relative font-sans">

      {/* LAYER 1: BACKGROUND REALITY (User Webcam) */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full opacity-80 scale-105">
          <VisionConfig onFaceDetected={setFaceDetected} />
        </div>
      </div>

      {/* LAYER 2: VIRTUAL AVATAR (Particles) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <AIAvatar isSpeaking={isSpeaking} transcript={transcript} />
      </div>

      {/* LAYER 3: HUD ELEMENTS (New) */}
      {started && <HUDOverlay />}

      {/* LAYER 4: BOOT SEQUENCE / START SCREEN */}
      {!started && !booting && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-display text-white mb-8 tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
              MIRROR<span className="text-violet-400">.OS</span>
            </h1>
            <button
              onClick={handleStart}
              className="group relative px-16 py-6 overflow-hidden border border-white/20 bg-black/40 backdrop-blur-md rounded-full transition-all hover:scale-105 hover:border-violet-400/50 hover:shadow-[0_0_40px_rgba(139,92,246,0.3)]"
            >
              <span className="relative z-10 font-mono text-sm tracking-[0.3em] text-violet-400 group-hover:text-white transition-colors">INITIALIZE NEURAL LINK</span>
            </button>
          </div>
        </div>
      )}

      {/* BOOT ANIMATION */}
      {booting && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center font-mono text-violet-500">
          <div className="w-64 h-1 bg-gray-900 mb-4 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 animate-[width_2s_ease-out_forwards]" style={{ width: '100%' }}></div>
          </div>
          <div className="text-xs uppercase tracking-widest">
            <p className="animate-pulse">Loading Neural Drivers...</p>
            <p className="animate-pulse delay-75">Calibrating Optical Sensors...</p>
            <p className="animate-pulse delay-150">Hacking The Mainframe...</p>
          </div>
        </div>
      )}

    </main>
  );
}
