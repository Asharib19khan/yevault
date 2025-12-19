
import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

interface VisionConfigProps {
    onFaceDetected?: (detected: boolean) => void;
}

const VisionConfig: React.FC<VisionConfigProps> = ({ onFaceDetected }) => {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [visionLoaded, setVisionLoaded] = useState(false);
    const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

    // Debug State
    const [camStatus, setCamStatus] = useState("Initializing...");
    const [camError, setCamError] = useState<string | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>(undefined);
    const [permissionState, setPermissionState] = useState<string>("unknown");

    // 1. Check Permissions & Devices on Mount
    useEffect(() => {
        const checkDevices = async () => {
            try {
                // Check if API exists
                if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                    setCamError("navigator.mediaDevices API missing. Context might be insecure (http vs https) or iframe permissions missing.");
                    setCamStatus("API_MISSING");
                    return;
                }

                // Request Permissions Test
                setCamStatus("Requesting Permission...");
                let stream: MediaStream | null = null;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    setPermissionState("granted");
                    setCamStatus("Permission Granted. Enumerating devices...");
                } catch (e: unknown) {
                    setPermissionState("denied");
                    if (e instanceof Error) {
                        setCamError(`Permission Error: ${e.name} - ${e.message}`);
                    } else {
                        setCamError(`Permission Error: Unknown`);
                    }
                    setCamStatus("PERMISSION_DENIED");
                    return;
                }

                // Stop the test stream to release device
                if (stream) {
                    (stream as MediaStream).getTracks().forEach(t => t.stop());
                }

                // List Devices
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(d => d.kind === 'videoinput');
                setDevices(videoDevices);

                if (videoDevices.length > 0) {
                    // Default to first device
                    setActiveDeviceId(videoDevices[0].deviceId);
                    setCamStatus(`Devices Found: ${videoDevices.length}. Starting Cam...`);
                } else {
                    setCamError("No video input devices found.");
                    setCamStatus("NO_DEVICES");
                }

            } catch (err: unknown) {
                setPermissionState("error");
                if (err instanceof Error) {
                    setCamError(`System Error: ${err.name}: ${err.message}`);
                } else {
                    setCamError(`System Error: Unknown`);
                }
                setCamStatus("SYSTEM_ERROR");
            }
        };
        checkDevices();
    }, []);

    // 2. Load Vision (MediaPipe)
    useEffect(() => {
        const loadVision = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
                );
                const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "GPU"
                    },
                    outputFaceBlendshapes: true,
                    runningMode: "VIDEO",
                    numFaces: 1
                });
                faceLandmarkerRef.current = faceLandmarker;
                setVisionLoaded(true);
            } catch (error) {
                console.error("Error loading MediaPipe Vision:", error);
            }
        };
        loadVision();
    }, []);

    // 3. Loop Prediction
    const predictWebcam = () => {
        if (!faceLandmarkerRef.current || !webcamRef.current?.video || !canvasRef.current) return;

        const video = webcamRef.current.video;
        const canvas = canvasRef.current;

        if (video.currentTime > 0 && !video.paused && !video.ended && video.readyState >= 2) {
            // eslint-disable-next-line react-hooks/purity
            const startTimeMs = performance.now();
            const results = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);

            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (results.faceLandmarks) {
                    const drawingUtils = new DrawingUtils(ctx);
                    for (const landmarks of results.faceLandmarks) {
                        // Stylized HUD Overlay for Face
                        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: '#00ffff10', lineWidth: 0.5 });
                        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: '#00ffff' });
                        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: '#00ffff' });
                        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: '#00ffff40' });
                    }
                    onFaceDetected?.(results.faceLandmarks.length > 0);
                } else {
                    onFaceDetected?.(false);
                }
            }
        }
        requestAnimationFrame(predictWebcam);
    };

    useEffect(() => {
        if (visionLoaded) {
            requestAnimationFrame(predictWebcam);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visionLoaded]);

    return (
        <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-slate-900">

            {/* DIAGNOSTIC PANEL */}
            <div className="absolute top-24 left-10 z-[100] p-4 bg-black/90 border border-cyan-500 text-xs font-mono text-cyan-500 max-w-sm shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                <h3 className="font-bold underline mb-2 text-white">SYSTEM DIAGNOSTICS</h3>
                <div className="mb-4 space-y-1">
                    <p>STATUS: <span className={camStatus.includes('ERROR') || camStatus.includes('DENIED') ? 'text-red-500 font-bold' : 'text-green-400'}>{camStatus}</span></p>
                    <p>PERMISSION: <span className={permissionState === 'granted' ? 'text-green-500' : 'text-red-500'}>{permissionState.toUpperCase()}</span></p>
                    {camError && <div className="bg-red-900/30 p-2 border-l-2 border-red-500 text-red-300 mt-2 break-words">{camError}</div>}
                </div>

                <div className="mb-2">
                    <p className="mb-1 text-white/70">DETECTED SENSORS:</p>
                    {devices.length === 0 ? <span className="text-gray-500 italic">Scanning...</span> : (
                        <select
                            className="bg-gray-800 text-white w-full p-2 border border-gray-600 outline-none focus:border-cyan-400"
                            onChange={(e) => setActiveDeviceId(e.target.value)}
                            value={activeDeviceId}
                        >
                            {devices.map((d, i) => (
                                <option key={d.deviceId} value={d.deviceId}>
                                    {d.label || `Camera Device ${i + 1}`}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="mt-4 text-[10px] text-gray-500 border-t border-gray-800 pt-2">
                    NOTE: If Blocked, check browser permissions icon in URL bar or iframe &apos;allow&apos; attributes.
                </div>
            </div>

            {/* Webcam Stream */}
            <Webcam
                ref={webcamRef}
                className="absolute inset-0 w-full h-full object-cover"
                mirrored
                audio={false}
                videoConstraints={{
                    deviceId: activeDeviceId ? { exact: activeDeviceId } : undefined
                }}
                onUserMedia={() => setCamStatus("STREAM_ACTIVE")}
                onUserMediaError={(err) => {
                    setCamStatus("WEBCAM_COMPONENT_ERROR");
                    setCamError(typeof err === 'string' ? err : err.message || JSON.stringify(err));
                }}
            />

            {/* Overlay Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
        </div>
    );
};

export default VisionConfig;
