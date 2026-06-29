"use client";
import React, { useState, useEffect, useRef } from "react";
import type { Channel, Stream } from "@/domain/entities";
import { Play, Volume2, VolumeX } from "lucide-react";
import type Hls from "hls.js";
import { usePlayer } from "@/presentation/context/PlayerContext";

interface HeroBillboardProps {
    channels: Channel[];
    streamsMap: Map<string, Stream[]>;
}

export function HeroBillboard({ channels, streamsMap }: HeroBillboardProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const { openPlayer } = usePlayer();

    const activeChannel = channels[currentIndex];
    const activeStream = activeChannel ? streamsMap.get(activeChannel.id)?.[0]?.url : null;

    const [videoStatus, setVideoStatus] = useState<"loading" | "playing" | "error">("loading");

    useEffect(() => {
        setVideoStatus("loading");
    }, [currentIndex]);

    useEffect(() => {
        // Auto cycle every 15 seconds
        if (channels.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % channels.length);
        }, 15000);
        return () => clearInterval(timer);
    }, [channels.length]);

    useEffect(() => {
        if (!activeStream || !videoRef.current) {
            setVideoStatus("error");
            return;
        }
        const video = videoRef.current;

        const onPlaying = () => setVideoStatus("playing");
        const onError = () => setVideoStatus("error");

        video.addEventListener("playing", onPlaying);
        video.addEventListener("error", onError);

        let hlsInstance: Hls | null = null;

        const loadStream = async () => {
            const HlsLib = (await import("hls.js")).default;
            if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

            if (HlsLib.isSupported()) {
                hlsInstance = new HlsLib({ enableWorker: true, lowLatencyMode: true });
                hlsRef.current = hlsInstance;
                hlsInstance.loadSource(activeStream);
                hlsInstance.attachMedia(video);
                hlsInstance.on(HlsLib.Events.MANIFEST_PARSED, () => {
                    video.play().catch(() => {});
                });
                hlsInstance.on(HlsLib.Events.ERROR, (_, data) => {
                    if (data.fatal) {
                        setVideoStatus("error");
                    }
                });
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = activeStream;
                video.play().catch(() => {});
            } else {
                setVideoStatus("error");
            }
        };
        loadStream();

        return () => {
            video.removeEventListener("playing", onPlaying);
            video.removeEventListener("error", onError);
            if (hlsInstance) { hlsInstance.destroy(); }
        };
    }, [activeStream]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    if (!activeChannel || !activeStream) return null;

    const handlePlay = () => {
        const streams = streamsMap.get(activeChannel.id) || [];
        openPlayer(activeChannel, streams);
    };

    return (
        <div className="hero-billboard">
            <div className="hero-video-container">
                {/* Fallback placeholder background (blurred logo or modern gradient) */}
                <div 
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: activeChannel.logo 
                            ? `url(${activeChannel.logo}) no-repeat center/contain` 
                            : "linear-gradient(135deg, var(--accent) 0%, #1e1b4b 100%)",
                        filter: activeChannel.logo ? "blur(30px) brightness(0.3)" : "none",
                        opacity: 0.4,
                        transition: "all 0.5s ease",
                    }}
                />
                
                {/* Channel logo centered as watermark when not playing video */}
                {activeChannel.logo && videoStatus !== "playing" && (
                    <div 
                        style={{
                            position: "absolute",
                            right: "10%",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "200px",
                            height: "200px",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            borderRadius: "24px",
                            padding: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backdropFilter: "blur(10px)",
                            opacity: 0.15,
                            transition: "all 0.5s ease",
                        }}
                    >
                        <img 
                            src={activeChannel.logo} 
                            alt={activeChannel.name} 
                            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                        />
                    </div>
                )}

                <video 
                    ref={videoRef}
                    className="hero-video"
                    autoPlay 
                    muted={isMuted} 
                    playsInline 
                    style={{
                        opacity: videoStatus === "playing" ? 0.7 : 0,
                        transition: "opacity 0.5s ease",
                    }}
                 />
                <div className="hero-vignette"></div>
            </div>
            
            <div className="hero-content">
                <span className="hero-badge">Featured in your Region</span>
                <h1 className="hero-title">{activeChannel.name}</h1>
                <p className="hero-desc">
                    {activeChannel.categories.join(", ")} • {activeChannel.country.toUpperCase()}
                </p>
                <div className="hero-actions">
                    <button className="hero-play-btn" onClick={handlePlay}>
                        <Play fill="currentColor" size={20} /> Watch Live
                    </button>
                    <button className="hero-mute-btn" onClick={() => setIsMuted(!isMuted)} title={isMuted ? "Unmute" : "Mute"}>
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>
            </div>

            <div className="hero-indicators">
                {channels.map((_, i) => (
                    <div 
                        key={i} 
                        className={`hero-dot ${i === currentIndex ? 'active' : ''}`} 
                        onClick={() => setCurrentIndex(i)}
                    />
                ))}
            </div>
        </div>
    );
}
