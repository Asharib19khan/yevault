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
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
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

  // 1. ENUMERATE DEVICES
  useEffect(() => {
    async function getDevices() {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices.filter(d => 
          d.kind === 'videoinput' && 
          !d.label.includes('DroidCam') && 
          !d.label.includes('Virtual')
        );
        setDevices(videoInputs);
      } catch (e) {
        console.error("Device Enum Error:", e);
      }
    }
    getDevices();
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
    } catch (err: any) {
      setCameraStatus(`Error: ${err.message}`);
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
          console.log("Speech Error:", event.error);
        };
        
        recognition.onend = () => {
          if (!isAiSpeaking && recognitionRef.current) {
             try { recognitionRef.current.start(); } catch(e) {}
          }
        };

        recognitionRef.current = recognition;
        try { recognition.start(); } catch(e) {}
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
      if (recognitionRef.current) try { recognitionRef.current.start(); } catch(e) {}
    };

    synth.speak(utterance);
  };

  const getBorderColor = () => {
    if (envError) return 'border-red-600';
    switch(interactionState) {
      case 'LISTENING': return 'border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.6)]';
      case 'PROCESSING': return 'border-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.8)]';
      default: return 'border-white/10';
    }
  };

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden relative">
      
      {/* START OVERLAY */}
      {!hasStarted && !envError && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center gap-6">
           <h1 className="text-4xl text-white font-mono tracking-widest animate-pulse">MIRROR.AI</h1>
           <button 
             onClick={handleStart}
             className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-full text-xl shadow-[0_0_30px_rgba(8,145,178,0.6)] transition-all"
           >
             TAP TO INITIALIZE
           </button>
           <p className="text-gray-500 text-sm max-w-xs text-center">
             Requires Camera & Microphone access.
             <br/>tap to unlock neural link.
           </p>
        </div>
      )}

      <div className={`relative w-[90%] h-[90%] rounded-3xl overflow-hidden border-4 transition-all duration-500 ease-in-out ${getBorderColor()}`}>
        
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
        />

        <div className="absolute inset-0 z-20 p-6 flex flex-col justify-between pointer-events-none">
           <div className="flex flex-col gap-2 pointer-events-auto items-start">
             <div className="bg-black/60 backdrop-blur border border-cyan-500/30 px-4 py-3 rounded-xl text-cyan-400 font-mono text-xs shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${cameraStatus === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{cameraStatus.toUpperCase()}</span>
                </div>
                
                {devices.length > 0 && (
                  <select 
                    className="bg-black/50 border border-cyan-500/30 rounded px-2 py-1 text-xs outline-none focus:border-cyan-400 w-48 mb-2"
                    value={activeDeviceId}
                    onChange={(e) => setActiveDeviceId(e.target.value)}
                  >
                    <option value="">Default (User Facing)</option>
                    {devices.map((device, i) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                )}
                <div className="text-cyan-200/70">STATE: {interactionState}</div>
             </div>
          </div>

          <div className="w-full flex justify-center pb-10">
             {transcript && (
               <div className="max-w-2xl bg-black/80 backdrop-blur-md border-l-4 border-cyan-400 p-6 rounded-r-xl shadow-2xl animate-fade-in-up">
                 <p className="font-mono text-cyan-50 text-xl leading-relaxed">
                   <span className="text-cyan-400 mr-2">{'>'}</span>
                   {transcript}
                   <span className="animate-blink inline-block w-2 h-5 bg-cyan-400 ml-2 align-middle"/>
                 </p>
               </div>
             )}
          </div>
        </div>

        {envError && (
          <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center">
            <div className="bg-red-900/20 border border-red-500 p-8 rounded-xl max-w-md text-center">
              <h2 className="text-2xl font-bold text-red-500 mb-4">SYSTEM ERROR</h2>
              <p className="text-white font-mono">{envError}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
