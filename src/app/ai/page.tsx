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
  const [permissionStatus, setPermissionStatus] = useState<string>("Requesting...");
  
  // AI State
  const [interactionState, setInteractionState] = useState<InteractionState>('IDLE');
  const [transcript, setTranscript] = useState<string>("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  // Refs
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

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
        if (videoInputs.length > 0) {
          setActiveDeviceId(videoInputs[0].deviceId); 
        }
      } catch (e) {
        console.error("Device Enum Error:", e);
      }
    }
    getDevices();
  }, []);

  // 2. CAMERA STREAM (Re-runs when activeDeviceId changes)
  useEffect(() => {
    const startStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          // Use specific device if selected, else default
          video: activeDeviceId ? { deviceId: { exact: activeDeviceId } } : true,
          audio: true 
        });

        setPermissionStatus("GRANTED");
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error("Stream Error:", err);
        setPermissionStatus(`ERROR: ${err.message}`);
      }
    };

    startStream();
  }, [activeDeviceId]);

  // 3. SPEECH RECOGNITION
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setPermissionStatus("BROWSER_UNSUPPORTED");
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
      console.log("Speech Error:", event.error);
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
        
        {/* VIDEO FEED */}
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
          <div className="flex justify-between items-start pointer-events-auto">
             <div className="bg-black/60 backdrop-blur border border-cyan-500/30 px-4 py-3 rounded-xl text-cyan-400 font-mono text-xs shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${permissionStatus === 'GRANTED' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{permissionStatus === 'GRANTED' ? 'SYSTEM ONLINE' : 'OFFLINE'}</span>
                </div>
                
                {/* CAMERA SELECTOR */}
                <select 
                  className="bg-black/50 border border-cyan-500/30 rounded px-2 py-1 text-xs outline-none focus:border-cyan-400 w-48"
                  value={activeDeviceId}
                  onChange={(e) => setActiveDeviceId(e.target.value)}
                >
                  {devices.map((device, i) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>

                <div className="mt-2 text-cyan-200/70">STATE: {interactionState}</div>
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
      </div>
    </div>
  );
}
