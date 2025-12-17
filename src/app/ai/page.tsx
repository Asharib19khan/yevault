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

export default function SafeMirrorAI() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>("Requesting...");
  const [aiStatus, setAiStatus] = useState<string>("Initializing...");
  const [transcript, setTranscript] = useState<string>("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  // Refs for logic to avoid closure staleness
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // 1. CAMERA & AUDIO PERMISSIONS (The "Eyes")
  useEffect(() => {
    const initStream = async () => {
      try {
        console.log("Requesting Camera & Mic access...");
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });

        console.log("Camera access granted!");
        setPermissionStatus("GRANTED");

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

      } catch (err: any) {
        console.error("Permission Denied/Error:", err);
        setPermissionStatus(`ERROR: ${err.message}`);
      }
    };

    initStream();
  }, []);

  // 2. SPEECH RECOGNITION (The "Ears")
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // @ts-ignore - Handle browser prefixes
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAiStatus("BROWSER_UNSUPPORTED");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log("Speech Recognition Started");
      setAiStatus("LISTENING");
    };

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }

      if (currentTranscript.trim()) {
        console.log("Speech detected:", currentTranscript);
        setTranscript(currentTranscript);
        handleSpeechInput(currentTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error", event.error);
      // Auto-restart if not allowed error
      if (event.error !== 'not-allowed' && event.error !== 'service-not-allowed') {
        setTimeout(() => {
          try { recognition.start(); } catch(e) {}
        }, 1000);
      }
    };

    recognition.onend = () => {
      // Keep it alive unless AI is speaking
      if (!isAiSpeaking) {
        try { recognition.start(); } catch(e) {}
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.log("Recognition start error:", e);
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop(); 
    };
  }, [isAiSpeaking]);

  // 3. SILENCE DETECTION & RESPONSE (The "Brain")
  const handleSpeechInput = (text: string) => {
    // Clear existing timer
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    // Set new timer for 2 seconds of silence
    silenceTimerRef.current = setTimeout(() => {
      console.log("Silence detected (2000ms). Triggering response...");
      triggerResponse(text);
    }, 2000);
  };

  const triggerResponse = (userText: string) => {
    if (!userText.trim()) return;

    // Pick a hype phrase
    const hype = HYPE_PHRASES[Math.floor(Math.random() * HYPE_PHRASES.length)];
    const fullResponse = `${hype} You said: ${userText}`;

    speak(fullResponse);
  };

  const speak = (text: string) => {
    if (typeof window === 'undefined') return;

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Config Voice
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Stop listening while speaking to avoid hearing itself
    setIsAiSpeaking(true);
    if (recognitionRef.current) recognitionRef.current.stop();

    utterance.onend = () => {
      console.log("AI finished speaking.");
      setIsAiSpeaking(false);
      setTranscript(""); // Clear transcript
      // Restart listening
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch(e) {}
      }
    };

    synth.speak(utterance);
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      
      {/* VIDEO FEED */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
      />

      {/* HUD OVERLAY */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-10">
        {/* Top Bar */}
        <div className="flex justify-between items-start">
          <div className="border border-cyan-500/50 bg-black/50 p-4 rounded backdrop-blur-md">
             <h1 className="text-2xl font-bold text-cyan-400">SAINT YEEZUS <span className="text-xs text-white bg-red-600 px-1 rounded">LIVE</span></h1>
             <div className="text-xs font-mono text-cyan-200 mt-2">
               <div>CAM: {permissionStatus}</div>
               <div>AI: {aiStatus} {isAiSpeaking && "(SPEAKING)"}</div>
             </div>
          </div>
          
          <div className="w-24 h-24 border border-cyan-500/30 rounded-full flex items-center justify-center animate-pulse">
            <div className={`w-2 h-2 rounded-full ${isAiSpeaking ? 'bg-red-500 box-shadow-red' : 'bg-cyan-500'}`}></div>
          </div>
        </div>

        {/* Center Target */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-white/10 rounded-full flex items-center justify-center">
           <div className="w-[280px] h-[280px] border-t border-b border-cyan-500/20 rounded-full animate-spin-slow"></div>
        </div>

        {/* Bottom Transcript */}
        <div className="w-full max-w-2xl mx-auto text-center">
          {transcript && (
            <div className="bg-black/60 backdrop-blur p-6 rounded-2xl border border-white/10 transition-all duration-300">
               <p className="text-xl text-white font-medium">"{transcript}"</p>
            </div>
          )}
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {permissionStatus.includes("ERROR") && (
         <div className="absolute inset-0 bg-black z-50 flex items-center justify-center text-red-500 p-10 text-center">
            <h2 className="text-4xl font-bold">ACCESS DENIED</h2>
            <p className="mt-4 text-xl">{permissionStatus}</p>
            <p className="mt-2 text-gray-500">Please verify browser permissions for Camera & Microphone.</p>
         </div>
      )}

    </div>
  );
}
