
import { useState, useEffect, useRef, useCallback } from 'react';

// Sycophantic Phrases
const PRAISE_PREFIXES = [
    "You have an incredible mind. ",
    "Genius observation. ",
    "I am learning so much from you. ",
    "Your intellect is staggering. ",
    "That is a profound insight. ",
    "You are absolutely correct. ",
    "God-tier articulation. ",
    "Precisely. "
];

export const useMirrorBrain = () => {
    const [transcript, setTranscript] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);

    // Use refs to break closure/dependency cycles
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    // Initialize Speech APIs
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // recognition setup
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';
                recognitionRef.current = recognition;
            }

            // synthesis setup
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    // Forward declaration via Ref to handle circular dependency
    const startListeningRef = useRef<() => void>(() => { });

    const speak = useCallback((text: string) => {
        if (!synthRef.current) return;

        // Sycophancy Logic
        const prefix = PRAISE_PREFIXES[Math.floor(Math.random() * PRAISE_PREFIXES.length)];
        const fullText = `${prefix} ${text}`;

        const utterance = new SpeechSynthesisUtterance(fullText);
        utterance.rate = 1.0;
        utterance.pitch = 0.9; // Slightly deeper/authoritative

        // Select Voice (prefer Google US English)
        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(v => v.name.includes("Google US English")) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => {
            setIsSpeaking(true);
            setIsListening(false);
            if (recognitionRef.current) recognitionRef.current.stop();
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            setTranscript(''); // Clear for next turn
            // Resume listening via Ref to avoid circular dependency
            startListeningRef.current();
        };

        synthRef.current.speak(utterance);
    }, []);

    const handleResult = useCallback((event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        const currentText = finalTranscript || interimTranscript;
        setTranscript(currentText);

        // Silence Detection
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        // Only trigger if we have meaningful text (even short words like 'Help')
        if (currentText.trim().length > 0) {
            silenceTimerRef.current = setTimeout(() => {
                speak(currentText);
            }, 2000); // 2 seconds silence
        }
    }, [speak]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isSpeaking) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch {
                // Ignore 'already started' errors
            }

            recognitionRef.current.onresult = handleResult;
            recognitionRef.current.onerror = (e: SpeechRecognitionErrorEvent) => {
                console.error("Speech Error", e);
                // Auto-recover mostly, but stop on 'not-allowed'
                if (e.error !== 'not-allowed' && !isSpeaking) {
                    setTimeout(() => startListeningRef.current(), 1000);
                }
            };
            recognitionRef.current.onend = () => {
                if (!isSpeaking) {
                    setIsListening(false);
                    setTimeout(() => startListeningRef.current(), 500);
                }
            };
        }
    }, [handleResult, isSpeaking]);

    // Update the ref whenever startListening changes
    useEffect(() => {
        startListeningRef.current = startListening;
    }, [startListening]);

    return {
        transcript,
        isSpeaking,
        isListening,
        startListening,
        // Expose raw recognition object if needed for debugging
        recognitionRef
    };
};
