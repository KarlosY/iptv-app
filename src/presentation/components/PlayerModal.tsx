"use client";
import React, { useEffect, useRef, useState } from "react";
import { X, Tv, AlertCircle, Loader2, Radio, Minimize2, Maximize2, Cast } from "lucide-react";
import type Hls from "hls.js";
import { usePlayer } from "@/presentation/context/PlayerContext";

export function PlayerModal() {
    const { state, closePlayer, setStream, toggleMini } = usePlayer();
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [status, setStatus] = useState<"loading" | "playing" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState("");
    const [logoError, setLogoError] = useState(false);

    const handleCast = async () => {
        if (videoRef.current && (videoRef.current as any).remotePlayback) {
            try {
                await (videoRef.current as any).remotePlayback.prompt();
            } catch (err) {
                console.error("Cast failed:", err);
            }
        } else {
            alert("Cast/AirPlay is not supported on this browser natively without SDK.");
        }
    };

    // init / destroy HLS when stream URL changes
    useEffect(() => {
        if (!state.isOpen || !state.activeStreamUrl) return;
        const video = videoRef.current;
        if (!video) return;

        setStatus("loading");
        setErrorMsg("");

        let hlsInstance: Hls | null = null;

        const load = async () => {
            const HlsLib = (await import("hls.js")).default;

            // Destroy previous instance
            if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

            if (HlsLib.isSupported()) {
                hlsInstance = new HlsLib({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 30,
                });
                hlsRef.current = hlsInstance;

                hlsInstance.loadSource(state.activeStreamUrl!);
                hlsInstance.attachMedia(video);

                hlsInstance.on(HlsLib.Events.MANIFEST_PARSED, () => {
                    video.play().catch(() => { });
                });

                hlsInstance.on(HlsLib.Events.ERROR, (_, data) => {
                    if (data.fatal) {
                        setStatus("error");
                        setErrorMsg("Stream unavailable or geo-blocked.");
                    }
                });
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                // Native HLS (Safari)
                video.src = state.activeStreamUrl!;
                video.play().catch(() => { });
            } else {
                setStatus("error");
                setErrorMsg("HLS not supported in this browser.");
            }
        };

        load();

        const onPlay = () => setStatus("playing");
        const onError = () => { setStatus("error"); setErrorMsg("Could not load stream."); };

        video.addEventListener("playing", onPlay);
        video.addEventListener("error", onError);

        return () => {
            video.removeEventListener("playing", onPlay);
            video.removeEventListener("error", onError);
            if (hlsInstance) { hlsInstance.destroy(); }
        };
    }, [state.activeStreamUrl, state.isOpen]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!state.isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") closePlayer();
            if (e.key === " " || e.key === "k") {
                e.preventDefault();
                const v = videoRef.current;
                if (v) v.paused ? v.play() : v.pause();
            }
            if (e.key === "f" || e.key === "F") {
                videoRef.current?.requestFullscreen?.();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [state.isOpen, closePlayer]);

    // Cleanup on close
    useEffect(() => {
        if (!state.isOpen && hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
    }, [state.isOpen]);

    if (!state.isOpen || !state.channel) return null;

    const { channel, streams, activeStreamUrl, isMini } = state;

    return (
        <div className={`player-backdrop ${isMini ? 'mini-backdrop' : ''}`} onClick={(e) => { if (e.target === e.currentTarget && !isMini) closePlayer(); }}>
            <div className={`player-container ${isMini ? 'player-mini' : ''}`}>
                {/* Header */}
                <div className="player-header">
                    {channel.logo && !logoError ? (
                        <img
                            src={channel.logo}
                            alt={channel.name}
                            className="player-channel-logo"
                            onError={() => setLogoError(true)}
                        />
                    ) : (
                        <div
                            style={{
                                width: 40, height: 40, background: "rgba(124,108,252,0.15)",
                                borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                        >
                            <Tv size={18} color="var(--accent)" />
                        </div>
                    )}
                    <div>
                        <p className="player-channel-name">{channel.name}</p>
                        <p className="player-channel-country">
                            {channel.country.toUpperCase()} · {channel.categories.join(", ")}
                        </p>
                    </div>

                    {status === "playing" && !isMini && (
                        <div className="badge" style={{ marginLeft: "auto", gap: 6, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}>
                            <span className="live-dot" style={{ width: 6, height: 6 }} />
                            LIVE
                        </div>
                    )}

                    <div style={{ marginLeft: status === "playing" && !isMini ? 12 : "auto", display: "flex", alignItems: "center", gap: 12 }}>
                        {!isMini && (
                            <button className="player-close" onClick={handleCast} title="Transmit to TV" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Cast size={16} />
                            </button>
                        )}
                        <button className="player-close" onClick={toggleMini} title={isMini ? "Expand" : "Picture in Picture"} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {isMini ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                        </button>
                        <button className="player-close" onClick={closePlayer} aria-label="Close player" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Video */}
                <div className="player-video-wrapper">
                    <video
                        ref={videoRef}
                        className="player-video"
                        controls
                        playsInline
                        autoPlay
                    />
                    {status === "loading" && (
                        <div className="player-status">
                            <Loader2 size={40} className="spinner" style={{ animation: "spin 0.7s linear infinite", color: "var(--accent)" }} />
                            <span>Loading stream…</span>
                        </div>
                    )}
                    {status === "error" && (
                        <div className="player-status">
                            <AlertCircle size={40} style={{ color: "#f87171" }} />
                            <span style={{ color: "#f87171", fontWeight: 600 }}>{errorMsg}</span>
                            <span style={{ fontSize: 12 }}>Try another stream below</span>
                        </div>
                    )}
                </div>

                {/* Footer: stream selector */}
                {!isMini && (
                    <div className="player-footer">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Radio size={13} style={{ color: "var(--text-muted)" }} />
                            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.5px" }}>
                                STREAMS ({streams.length})
                            </span>
                        </div>
                        <div className="stream-list">
                            {streams.map((s, i) => (
                                <button
                                    key={i}
                                    className={`stream-btn ${activeStreamUrl === s.url ? "active" : ""}`}
                                    onClick={() => { setStream(s.url); setStatus("loading"); }}
                                >
                                    {s.quality ?? s.title ?? `Stream ${i + 1}`}
                                </button>
                            ))}
                        </div>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            Keyboard: <kbd style={{ padding: "1px 5px", border: "1px solid var(--border)", borderRadius: 4 }}>Space</kbd> Play/Pause ·{" "}
                            <kbd style={{ padding: "1px 5px", border: "1px solid var(--border)", borderRadius: 4 }}>F</kbd> Fullscreen ·{" "}
                            <kbd style={{ padding: "1px 5px", border: "1px solid var(--border)", borderRadius: 4 }}>Esc</kbd> Close
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
