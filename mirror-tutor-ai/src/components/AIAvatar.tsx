
import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

// --- AUDIO ANALYZER HOOK ---
const useAudioAnalyzer = () => {
    const [analyzer, setAnalyzer] = useState<AnalyserNode | null>(null);
    const [dataArray, setDataArray] = useState<Uint8Array | null>(null);

    useEffect(() => {
        const initAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const source = audioCtx.createMediaStreamSource(stream);
                const ana = audioCtx.createAnalyser();
                ana.fftSize = 512;
                source.connect(ana);

                setAnalyzer(ana);
                setDataArray(new Uint8Array(ana.frequencyBinCount));
            } catch (e) {
                // console.error("Mic access denied for visualizer", e);
            }
        };
        initAudio();
    }, []);

    return { analyzer, dataArray };
};

// --- MIND GALAXY (3D TEXT SYSTEM) ---
const WordStar = ({ text, position }: { text: string, position: [number, number, number] }) => {
    return (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
            <Text
                position={position}
                fontSize={0.3}
                color="white"
                font="/fonts/Inter-Bold.woff"
                characters="abcdefghijklmnopqrstuvwxyz0123456789!"
                anchorX="center"
                anchorY="middle"
                maxWidth={3}
                textAlign="center"
            >
                {text}
                <meshBasicMaterial toneMapped={false} />
            </Text>
        </Float>
    );
}

// --- NEURAL DUST COMPONENT (REPLACED BUBBLES) ---
// Uses GL_POINTS for a sleek, high-tech dust effect rather than geometry meshes
const NeuralDust = ({ analyzer, dataArray, isSpeaking }: any) => {
    const count = 3000;
    const meshRef = useRef<THREE.Points>(null);

    // Initial random positions & attributes
    const { positions, randoms } = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const randoms = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;     // x
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20; // y
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10; // z
            randoms[i] = Math.random();
        }
        return { positions, randoms };
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;

        let audioLevel = 0;
        let bass = 0;

        if (analyzer && dataArray) {
            analyzer.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((p: number, c: number) => p + c, 0) / dataArray.length;
            audioLevel = avg / 255;
            bass = dataArray[10] / 255;
        } else if (isSpeaking) {
            audioLevel = (Math.sin(state.clock.elapsedTime * 10) + 1) * 0.2;
            bass = 0.5;
        }

        const time = state.clock.getElapsedTime();

        // Manipulate the position/scale attribute indirectly via rotation/scale of the container
        // Creating a "Breathing" effect for the whole cloud based on Bass
        const scale = 1 + (bass * 0.2);
        meshRef.current.scale.set(scale, scale, scale);

        // Rotate the cloud slowly, faster with audio
        meshRef.current.rotation.y = time * 0.05 + (audioLevel * 0.2);
        meshRef.current.rotation.z = time * 0.02;

    });

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.06}
                color="#8b5cf6"
                transparent
                opacity={0.8}
                sizeAttenuation={true}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

// --- MAIN AVATAR COMPONENT ---
interface AIAvatarProps {
    isSpeaking: boolean;
    transcript: string;
}

const AIAvatar: React.FC<AIAvatarProps> = ({ isSpeaking, transcript }) => {
    const { analyzer, dataArray } = useAudioAnalyzer();
    const [words, setWords] = useState<{ id: number, text: string, pos: [number, number, number] }[]>([]);

    useEffect(() => {
        if (!transcript || transcript.length < 3) return;
        const lastWord = transcript.split(' ').pop();
        if (lastWord) {
            const newWord = {
                id: Date.now(),
                text: lastWord,
                pos: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4] as [number, number, number]
            };
            setWords(prev => [...prev.slice(-15), newWord]);
        }
    }, [transcript]);

    return (
        <div className="w-full h-full relative flex flex-col overflow-hidden bg-transparent">

            {/* 3D Canvas (Overlay) */}
            <div className="flex-1 w-full relative z-0">
                <Canvas camera={{ position: [0, 0, 12], fov: 50 }} gl={{ alpha: true }}>
                    <ambientLight intensity={0.5} />

                    {/* Replaced Bubbles with Neural Dust */}
                    <NeuralDust analyzer={analyzer} dataArray={dataArray} isSpeaking={isSpeaking} />

                    {/* Subtle Background Stars for Depth */}
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                    {words.map(w => (
                        <WordStar key={w.id} text={w.text} position={w.pos} />
                    ))}

                </Canvas>
            </div>

            {/* Dynamic Transcript Overlay */}
            <div className="absolute bottom-16 w-full text-center z-20 px-8">
                <p className="font-mono text-violet-400/70 text-[10px] uppercase mb-4 tracking-[0.4em] animate-pulse">
                    {isSpeaking ? '/// RECEIVING NEURAL TRANSMISSION ///' : ''}
                </p>
                <h1 className="text-4xl md:text-6xl font-extralight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 tracking-tight drop-shadow-2xl">
                    {transcript}
                </h1>
            </div>

        </div>
    );
};

export default AIAvatar;
