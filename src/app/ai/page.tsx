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
  const [permissionStatus, setPermissionStatus] = useState<string>("Requesting...");
  
  // HUD & State
  const [interactionState, setInteractionState] = useState<InteractionState>('IDLE');
  const [transcript, setTranscript] = useState<string>("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  // Refs
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // 1. CAMERA & AUDIO PERMISSIONS
  useEffect(() => {
    const initStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setPermissionStatus("GRANTED");
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        setPermissionStatus(`ERROR: ${err.message}`);
      }
    };
    initStream();
  }, []);

  // 2. SPEECH RECOGNITION
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      // Only set to IDLE if not processing to avoid overriding
      setInteractionState(prev => prev === 'PROCESSING' ? 'PROCESSING' : 'IDLE');
    };

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

    recognition.onerror = (event: any) => {
      if (event.error !== 'not-allowed') {
        setTimeout(() => { try { recognition.start(); } catch(e) {} }, 1000);
      }
    };

    recognition.onend = () => {
      if (!isAiSpeaking) {
        try { recognition.start(); } catch(e) {}
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) {}

    return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
  }, [isAiSpeaking]);

  // 3. SILENCE LOGIC
  const handleSpeechInput = (text: string) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    silenceTimerRef.current = setTimeout(() => {
      setInteractionState('PROCESSING');
      triggerResponse(text);
    }, 2000);
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
    
    setIsAiSpeaking(true);
    if (recognitionRef.current) recognitionRef.current.stop();

    utterance.onend = () => {
      setIsAiSpeaking(false);
      setTranscript(""); 
      setInteractionState('IDLE');
      if (recognitionRef.current) try { recognitionRef.current.start(); } catch(e) {}
    };

    synth.speak(utterance);
  };

  // 4. VISUAL STYLES (God Mode)
  const getBorderColor = () => {
    switch(interactionState) {
      case 'LISTENING': return 'border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.6)]'; // Gold/Electric Green feel
      case 'PROCESSING': return 'border-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.8)]'; // Red/Orange
      default: return 'border-white/10'; // Idle
    }
  };

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden relative">
      
      {/* GOD MODE CONTAINER */}
      <div className={`relative w-[90%] h-[90%] rounded-3xl overflow-hidden border-4 transition-all duration-500 ease-in-out ${getBorderColor()}`}>
        
        {/* VIDEO FEED */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
        />

        {/* HUD OVERLAY */}
        <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
          
          {/* Top Info */}
          <div className="flex justify-between items-start">
             <div className="bg-black/40 backdrop-blur border border-cyan-500/30 px-4 py-2 rounded-lg text-cyan-400 font-mono text-xs">
                <div>SYSTEM: ONLINE</div>
                <div>STATE: {interactionState}</div>
             </div>
          </div>

          {/* IRON MAN TRANSCRIPT (Bottom) */}
          <div className="w-full flex justify-center pb-20">
             {transcript && (
               <div className="max-w-3xl bg-black/70 backdrop-blur-md border border-cyan-500/50 p-6 rounded-xl shadow-2xl animate-fade-in-up">
                 <p className="font-mono text-cyan-50 text-xl leading-relaxed text-center drop-shadow-md">
                   {transcript}
                   <span className="animate-pulse inline-block w-2 h-4 bg-cyan-400 ml-2 align-middle"/>
                 </p>
               </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
}
