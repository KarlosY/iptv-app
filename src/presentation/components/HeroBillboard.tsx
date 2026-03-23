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

    useEffect(() => {
        // Auto cycle every 15 seconds
        if (channels.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % channels.length);
        }, 15000);
        return () => clearInterval(timer);
    }, [channels.length]);

    useEffect(() => {
        if (!activeStream || !videoRef.current) return;
        const video = videoRef.current;
        video.muted = isMuted;

        const loadStream = async () => {
            const HlsLib = (await import("hls.js")).default;
            if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

            if (HlsLib.isSupported()) {
                const hls = new HlsLib({ enableWorker: true, lowLatencyMode: true });
                hlsRef.current = hls;
                hls.loadSource(activeStream);
                hls.attachMedia(video);
                hls.on(HlsLib.Events.MANIFEST_PARSED, () => {
                    video.play().catch(() => {});
                });
                hls.on(HlsLib.Events.ERROR, (_, data) => {
                    if (data.fatal) {
                        // Skip to next automatically if stream is dead
                        setCurrentIndex((prev) => (prev + 1) % channels.length);
                    }
                });
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = activeStream;
                video.play().catch(() => {});
            }
        };
        loadStream();

        return () => {
            if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
        };
    }, [activeStream, channels.length]); // Intentionally omitting isMuted so we don't reload stream when toggling mute

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
                <video 
                    ref={videoRef}
                    className="hero-video"
                    autoPlay 
                    muted={isMuted} 
                    playsInline 
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
