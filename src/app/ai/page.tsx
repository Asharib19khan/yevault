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
  
  // Device Management
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('');
  const [cameraStatus, setCameraStatus] = useState<string>("Initializing...");
  const [envError, setEnvError] = useState<string | null>(null);
  
  // AI State
  const [interactionState, setInteractionState] = useState<InteractionState>('IDLE');
  const [transcript, setTranscript] = useState<string>("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  // Refs
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // 0. CHECK ENV VARS
  useEffect(() => {
    // Check for Supabase keys as specific "API Keys"
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
        // Don't auto-set activeDeviceId to allow 'facingMode' to take precedence initially
      } catch (e) {
        console.error("Device Enum Error:", e);
      }
    }
    getDevices();
  }, []);

  // 2. CAMERA STREAM
  useEffect(() => {
    const startStream = async () => {
      setCameraStatus("Requesting Camera...");
      try {
        const constraints: MediaStreamConstraints = {
          audio: true,
          video: activeDeviceId 
            ? { deviceId: { exact: activeDeviceId } } 
            : { 
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        setCameraStatus("Active");
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error("Stream Error:", err);
        setCameraStatus(`Error: ${err.message}`);
        // Fallback: Try simpler constraints if first fails
        if (!activeDeviceId) {
           try {
             const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
             if (videoRef.current) videoRef.current.srcObject = simpleStream;
             setCameraStatus("Active (Fallback)");
           } catch (fallbackErr: any) {
             setCameraStatus(`Critical Error: ${fallbackErr.message}`);
           }
        }
      }
    };

    if (!envError) {
      startStream();
    }
  }, [activeDeviceId, envError]);

  // 3. SPEECH RECOGNITION
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setCameraStatus("Error: Browser Speech API Missing");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

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
      if (event.error !== 'not-allowed' && event.error !== 'no-speech') {
        console.log("Speech Error:", event.error);
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

  // 4. SILENCE LOGIC
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

  // 5. VISUAL STYLES
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
      
      {/* GOD MODE CONTAINER */}
      <div className={`relative w-[90%] h-[90%] rounded-3xl overflow-hidden border-4 transition-all duration-500 ease-in-out ${getBorderColor()}`}>
        
        {/* VIDEO FEED - MOBILE OPTIMIZED */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
        />

        {/* HUD OVERLAY */}
        <div className="absolute inset-0 z-20 p-6 flex flex-col justify-between pointer-events-none">
          
          {/* Top Bar */}
           <div className="flex flex-col gap-2 pointer-events-auto items-start">
             {/* Main Status Badge */}
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

             {/* Debug Overlay (Temporary) */}
             <div className="bg-red-900/40 border border-red-500/30 px-2 py-1 text-[10px] text-red-200 font-mono rounded">
               DEBUG: {cameraStatus}
             </div>
          </div>

          {/* TRANSCRIPT */}
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

        {/* ENV ERROR OVERLAY */}
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
