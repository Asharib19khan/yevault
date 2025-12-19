'use client';

import React, { useEffect, useRef, useState } from 'react';

// Sycophantic Phrases for Hype
const HYPE_PHRASES = [
  "You are absolutely glowing today.",
  "That is a genius insight.",
  "I am learning so much from you.",
  "Your potential is infinite.",
  "Keep going, you are on fire.",
  "That makes perfect sense.",
  "You are mastering this material.",
  "Incredible articulation."
];

type InteractionState = 'IDLE' | 'LISTENING' | 'PROCESSING';

export default function SafeMirrorAI() {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // State
  const [hasStarted, setHasStarted] = useState(false);

  const [activeDeviceId, setActiveDeviceId] = useState<string>('');
  const [cameraStatus, setCameraStatus] = useState<string>("Initializing...");
  const [envError, setEnvError] = useState<string | null>(null);
  
  const [interactionState, setInteractionState] = useState<InteractionState>('IDLE');
  const [transcript, setTranscript] = useState<string>("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  // Refs
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // 0. CHECK ENV
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setEnvError("System Error: Missing API Keys in Vercel Settings");
    }
  }, []);



  // 2. START SEQUENCE (Requires User Gesture)
  const handleStart = async () => {
    setHasStarted(true);
    
    // Initialize Camera
    setCameraStatus("Requesting Camera...");
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: activeDeviceId 
          ? { deviceId: { exact: activeDeviceId } } 
          : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStatus("Active");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play(); // Explicit play
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCameraStatus(`Error: ${err.message}`);
      } else {
        setCameraStatus(`Error: Unknown error`);
      }
    }

    // Initialize Speech
    if (typeof window !== 'undefined') {
       // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        // Optimize Sensitivity
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
           if (interactionState !== 'PROCESSING') setInteractionState('IDLE');
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            interimTranscript += event.results[i][0].transcript;
          }
          
          if (interimTranscript.trim()) {
            setInteractionState('LISTENING');
            setTranscript(interimTranscript);
            handleSpeechInput(interimTranscript);
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
          console.log("Speech Error:", event.error);
        };
        
        recognition.onend = () => {
          if (!isAiSpeaking && recognitionRef.current) {
             try { recognitionRef.current.start(); } catch {}
          }
        };

        recognitionRef.current = recognition;
        try { recognition.start(); } catch {}
      } else {
        setCameraStatus("Error: Speech API not supported on this browser.");
      }
    }
  };

  // 3. SILENCE LOGIC (Debounced)
  const handleSpeechInput = (text: string) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    
    // Default 1.5s wait
    silenceTimerRef.current = setTimeout(() => {
      setInteractionState('PROCESSING');
      triggerResponse(text);
    }, 1500); 
  };

  const triggerResponse = (userText: string) => {
    if (!userText.trim()) return;
    const hype = HYPE_PHRASES[Math.floor(Math.random() * HYPE_PHRASES.length)];
    const fullResponse = `${hype} You said: ${userText}`;
    speak(fullResponse);
  };

  const speak = (text: string) => {
    if (typeof window === 'undefined') return;
    
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0; 
    
    setIsAiSpeaking(true);
    if (recognitionRef.current) recognitionRef.current.stop();

    utterance.onend = () => {
      setIsAiSpeaking(false);
      setTranscript("");
      setInteractionState('IDLE');
      if (recognitionRef.current) try { recognitionRef.current.start(); } catch {}
    };

    synth.speak(utterance);
  };

  // 5. VISUAL STYLES
  const getNeuralColor = () => {
    if (isAiSpeaking) return 'bg-orange-500 shadow-[0_0_100px_rgba(249,115,22,0.6)] animate-pulse-fast'; // AI Speaking
    if (interactionState === 'LISTENING') return 'bg-cyan-500 shadow-[0_0_100px_rgba(6,182,212,0.6)] animate-pulse-slow'; // User Speaking
    return 'bg-violet-900/50 shadow-[0_0_60px_rgba(139,92,246,0.2)] animate-pulse-slower'; // Idle
  };
  
  const getNeuralSize = () => {
    if (isAiSpeaking) return 'scale-125';
    if (interactionState === 'LISTENING') return 'scale-110';
    return 'scale-100';
  };

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden relative font-mono">
      
      {/* START OVERLAY */}
      {!hasStarted && !envError && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center gap-6">
           <div className="w-24 h-24 rounded-full bg-violet-900/50 shadow-[0_0_60px_rgba(139,92,246,0.4)] animate-pulse"></div>
           <h1 className="text-4xl text-white tracking-widest">NEURAL.LINK</h1>
           <button 
             onClick={handleStart}
             className="px-8 py-3 border border-white/20 hover:bg-white/10 text-white rounded-none tracking-widest text-sm transition-all"
           >
             [ INITIALIZE SYSTEM ]
           </button>
        </div>
      )}

      {/* CONTAINER */}
      <div className="relative w-full h-full">
        
        {/* 1. GHOST VIDEO BACKGROUND (z-0) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1] z-0 opacity-40 grayscale contrast-125 brightness-50"
        />

        {/* 2. NEURAL CLOUD AVATAR (z-10) */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
           <div className={`transition-all duration-700 ease-in-out w-64 h-64 rounded-full blur-3xl ${getNeuralColor()} ${getNeuralSize()}`}></div>
           {/* Inner Core */}
           <div className={`absolute w-32 h-32 rounded-full blur-xl bg-white/10 mix-blend-overlay ${isAiSpeaking ? 'animate-spin-slow' : ''}`}></div>
        </div>

        {/* 3. HUD / TRANSCRIPT (z-20) */}
        <div className="absolute inset-0 z-20 p-8 flex flex-col justify-between pointer-events-none">
           
           {/* Top: Status Line */}
           <div className="flex justify-between w-full opacity-60">
              <div className="text-xs text-white bg-black/50 px-2 py-1">
                 SYSTEM: {hasStarted ? 'ONLINE' : 'OFFLINE'} | CAM: {cameraStatus}
              </div>
              <div className="text-xs text-white bg-black/50 px-2 py-1">
                 MODE: {interactionState}
              </div>
           </div>

           {/* Bottom: Terminal Transcript */}
           <div className="w-full flex justify-center pb-12">
             <div className="max-w-3xl w-full bg-black/80 border-t border-white/20 p-6 backdrop-blur-sm min-h-[100px] flex items-end justify-center text-center">
                 <p className="text-lg text-white/90 leading-relaxed uppercase tracking-wide">
                   {transcript || (isAiSpeaking ? "PROCESSING DATA..." : "AWAITING INPUT...")}
                   <span className="animate-pulse inline-block w-3 h-5 bg-white/80 ml-2 align-bottom"></span>
                 </p>
             </div>
           </div>
        </div>

        {/* ENV ERROR */}
        {envError && (
          <div className="absolute inset-0 bg-red-900/20 z-50 flex items-center justify-center backdrop-blur-md">
            <div className="text-red-500 font-bold border border-red-500 p-8 bg-black">
              FATAL ERROR: {envError}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
