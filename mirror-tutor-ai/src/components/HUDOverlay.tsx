
import React, { useEffect, useState } from 'react';

export const HUDOverlay = () => {
    const [time, setTime] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date().toLocaleTimeString([], { hour12: false }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none w-full h-full text-cyan-500" style={{ fontFamily: '"Share Tech Mono", monospace' }}>

            {/* CORNER BRACKETS */}
            <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-xl"></div>
            <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-xl"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-xl"></div>
            <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-cyan-500/50 rounded-br-xl"></div>

            {/* TOP CENTER COMPASS */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                <div className="w-64 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
                <div className="flex gap-4 text-[10px] opacity-70">
                    <span>NW</span><span>N</span><span className="text-white font-bold">0</span><span>NE</span><span>E</span>
                </div>
            </div>

            {/* LEFT STATS */}
            <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 text-[10px] text-cyan-400/70 uppercase">
                <div>
                    <p className="opacity-50">CPU_CORE</p>
                    <div className="w-24 h-1 bg-gray-800 mt-1"><div className="w-[80%] h-full bg-cyan-500 animate-pulse"></div></div>
                </div>
                <div>
                    <p className="opacity-50">MEM_ALLOC</p>
                    <div className="w-24 h-1 bg-gray-800 mt-1"><div className="w-[45%] h-full bg-cyan-500"></div></div>
                </div>
                <div>
                    <p className="opacity-50">NEURAL_NET</p>
                    <div className="w-24 h-1 bg-gray-800 mt-1"><div className="w-[92%] h-full bg-cyan-500"></div></div>
                </div>
            </div>

            {/* RIGHT TIME & DATE */}
            <div className="absolute right-8 top-8 text-right">
                <h1 className="text-2xl font-bold tracking-widest">{time}</h1>
                <p className="text-xs opacity-60">TEST_SESSION_V4</p>
                <p className="text-xs opacity-60">STATUS: ACTIVE</p>
            </div>

            {/* SCANLINES */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_4px,6px_100%] pointer-events-none opacity-20"></div>

            {/* VIGNETTE */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]"></div>

        </div>
    );
};
