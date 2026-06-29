"use client";
import React, { useEffect, useRef, useState } from "react";
import { X, Tv, AlertCircle, Loader2, Radio, Minimize2, Maximize2, Cast, Calendar } from "lucide-react";
import type Hls from "hls.js";
import { usePlayer } from "@/presentation/context/PlayerContext";
import { useAppStore } from "@/presentation/store/useAppStore";
import { normalizeEpgName, getCurrentProgram } from "@/application/services/epgService";

export function PlayerModal() {
    const { state, openPlayer, closePlayer, setStream, toggleMini } = usePlayer();
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [status, setStatus] = useState<"loading" | "playing" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState("");
    const [logoError, setLogoError] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [hoveredOption, setHoveredOption] = useState<number | null>(null);

    // Advanced playback options
    const [aspectRatio, setAspectRatio] = useState<"contain" | "fill" | "cover">("contain");
    const [hlsLevels, setHlsLevels] = useState<{ id: number; name: string }[]>([]);
    const [currentLevel, setCurrentLevel] = useState<number>(-1);
    const [isPipSupported, setIsPipSupported] = useState(false);

    useEffect(() => {
        if (typeof document !== "undefined") {
            setIsPipSupported(
                !!(document as any).pictureInPictureEnabled || 
                !!(videoRef.current && (videoRef.current as any).requestPictureInPicture)
            );
        }
    }, [state.isOpen]);

    const toggleNativePiP = async () => {
        if (videoRef.current) {
            try {
                if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture();
                } else {
                    await videoRef.current.requestPictureInPicture();
                }
            } catch (err) {
                console.error("Failed to toggle native PiP:", err);
            }
        }
    };

    const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = parseInt(e.target.value);
        setCurrentLevel(val);
        if (hlsRef.current) {
            hlsRef.current.currentLevel = val;
        }
    };

    const triggerChromecast = async () => {
        if (videoRef.current && (videoRef.current as any).remotePlayback) {
            try {
                await (videoRef.current as any).remotePlayback.prompt();
            } catch (err: any) {
                console.error("Cast failed:", err);
                alert("Error al iniciar la transmisión: " + (err.message || err));
            }
        } else {
            alert("El protocolo RemotePlayback no está soportado nativamente en este navegador. Te recomendamos usar Google Chrome.");
        }
    };

    const triggerAirPlay = () => {
        if (videoRef.current && (videoRef.current as any).webkitShowPlaybackTargetPicker) {
            try {
                (videoRef.current as any).webkitShowPlaybackTargetPicker();
            } catch (err: any) {
                console.error("AirPlay failed:", err);
                alert("Error al iniciar AirPlay: " + (err.message || err));
            }
        } else {
            alert("AirPlay solo es soportado en el navegador Safari de Apple en dispositivos macOS o iOS.");
        }
    };

    // init / destroy HLS when stream URL changes
    useEffect(() => {
        if (!state.isOpen || !state.activeStreamUrl) return;
        const video = videoRef.current;
        if (!video) return;

        setStatus("loading");
        setErrorMsg("");
        setHlsLevels([]);
        setCurrentLevel(-1);

        let hlsInstance: Hls | null = null;

        const load = async () => {
            const HlsLib = (await import("hls.js")).default;

            // Destroy previous instance
            if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

            // Restore volume
            const savedVolume = localStorage.getItem("player-volume");
            const savedMuted = localStorage.getItem("player-muted");
            if (savedVolume !== null) {
                video.volume = parseFloat(savedVolume);
            }
            if (savedMuted !== null) {
                video.muted = savedMuted === "true";
            }

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
                    if (hlsInstance) {
                        const levels = hlsInstance.levels.map((lvl: any, idx: number) => ({
                            id: idx,
                            name: lvl.name || (lvl.height ? `${lvl.height}p` : `Nivel ${idx + 1}`),
                        }));
                        setHlsLevels(levels);
                        setCurrentLevel(hlsInstance.currentLevel);
                    }
                });

                hlsInstance.on(HlsLib.Events.LEVEL_SWITCHED, (_, data) => {
                    setCurrentLevel(data.level);
                });

                hlsInstance.on(HlsLib.Events.ERROR, (_, data) => {
                    if (data.fatal) {
                        setStatus("error");
                        const isHttp = state.activeStreamUrl?.startsWith("http://");
                        const isHttpsSite = typeof window !== "undefined" && window.location.protocol === "https:";
                        if (isHttp && isHttpsSite) {
                            setErrorMsg("Bloqueo de contenido mixto (Señal HTTP en sitio HTTPS). Habilita 'contenido no seguro' en la configuración del sitio de tu navegador.");
                        } else {
                            setErrorMsg("Señal no disponible o con bloqueo geográfico.");
                        }
                    }
                });
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                // Native HLS (Safari)
                video.src = state.activeStreamUrl!;
                video.play().catch(() => { });
            } else {
                setStatus("error");
                setErrorMsg("HLS no es soportado nativamente en este navegador.");
            }
        };

        load();

        const onPlay = () => setStatus("playing");
        const onError = () => { 
            setStatus("error"); 
            const isHttp = state.activeStreamUrl?.startsWith("http://");
            const isHttpsSite = typeof window !== "undefined" && window.location.protocol === "https:";
            if (isHttp && isHttpsSite) {
                setErrorMsg("Bloqueo de contenido mixto (Señal HTTP en sitio HTTPS). Habilita 'contenido no seguro' en la configuración del sitio de tu navegador.");
            } else {
                setErrorMsg("No se pudo cargar el stream."); 
            }
        };

        const handleVolumeChange = () => {
            if (videoRef.current) {
                localStorage.setItem("player-volume", videoRef.current.volume.toString());
                localStorage.setItem("player-muted", videoRef.current.muted.toString());
            }
        };

        video.addEventListener("playing", onPlay);
        video.addEventListener("error", onError);
        video.addEventListener("volumechange", handleVolumeChange);

        return () => {
            video.removeEventListener("playing", onPlay);
            video.removeEventListener("error", onError);
            video.removeEventListener("volumechange", handleVolumeChange);
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

    // Query param detection to play shared streams
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const playUrl = urlParams.get('playUrl');
        if (playUrl) {
            const channelName = urlParams.get('name') || 'Canal Compartido';
            
            // Clean up query parameters so they don't trigger again on refreshes
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            
            const tempChannel = {
                id: 'shared_temp_' + Date.now(),
                name: channelName,
                alt_names: [],
                network: null,
                owners: [],
                country: 'compartido',
                subdivision: null,
                city: null,
                broadcast_area: [],
                languages: [],
                categories: ['Compartido'],
                is_nsfw: false,
                launched: null,
                closed: null,
                replaced_by: null,
                website: null,
                logo: ''
            };
            const tempStream = {
                channel: tempChannel.id,
                feed: null,
                title: 'HD',
                url: playUrl,
                referrer: null,
                user_agent: null,
                quality: '1080p',
                status: 'active',
                width: null,
                height: null,
                bitrate: null,
                frame_rate: null,
                added: null,
                updated: null,
                expires: null,
                is_closing: false
            };
            
            openPlayer(tempChannel, [tempStream]);
        }
    }, [openPlayer]);

    const epgData = useAppStore(s => s.epgData);

    if (!state.isOpen || !state.channel) return null;

    const { channel, streams, activeStreamUrl, isMini } = state;

    const normName = channel ? normalizeEpgName(channel.name) : "";
    const programs = epgData[normName];
    const { current, progress } = getCurrentProgram(programs);

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
                        {current ? (
                            <p className="player-channel-country" style={{ color: "var(--accent)", fontWeight: 600, display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                                🔴 {current.title} 
                                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400 }}>
                                    ({current.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {current.stop.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                </span>
                            </p>
                        ) : (
                            <p className="player-channel-country">
                                {channel.country ? channel.country.toUpperCase() : ""} · {channel.categories.join(", ")}
                            </p>
                        )}
                    </div>

                    {status === "playing" && !isMini && (
                        <div className="badge" style={{ marginLeft: "auto", gap: 6, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}>
                            <span className="live-dot" style={{ width: 6, height: 6 }} />
                            LIVE
                        </div>
                    )}

                    <div style={{ marginLeft: status === "playing" && !isMini ? 12 : "auto", display: "flex", alignItems: "center", gap: 12 }}>
                        {!isMini && (
                            <button className="player-close" onClick={() => setIsShareModalOpen(true)} title="Transmit to TV" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                        style={{ objectFit: aspectRatio }}
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
                        <div className="player-status" style={{ padding: "20px", textAlign: "center", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <AlertCircle size={40} style={{ color: "#f87171", margin: "0 auto" }} />
                            <span style={{ color: "#f87171", fontWeight: 600, fontSize: "14px", lineHeight: "1.4" }}>{errorMsg}</span>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Prueba con otra señal (stream) en la parte inferior si está disponible.</span>
                        </div>
                    )}
                </div>

                {/* Playback Settings toolbar */}
                {!isMini && (
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, padding: "14px 24px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.01)" }}>
                        {/* Aspect Ratio */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.5px" }}>ASPECTO</span>
                            <div style={{ display: "flex", gap: 4 }}>
                                {(["contain", "fill", "cover"] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setAspectRatio(mode)}
                                        style={{
                                            padding: "4px 8px",
                                            borderRadius: "6px",
                                            border: "1px solid var(--border)",
                                            background: aspectRatio === mode ? "var(--accent)" : "rgba(255,255,255,0.03)",
                                            color: aspectRatio === mode ? "white" : "var(--text-secondary)",
                                            fontSize: 11,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        {mode === "contain" ? "Original" : mode === "fill" ? "Estirar" : "Zoom"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* HLS Resolution (if levels are available) */}
                        {hlsLevels.length > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.5px" }}>CALIDAD</span>
                                <select
                                    value={currentLevel}
                                    onChange={handleLevelChange}
                                    style={{
                                        padding: "4px 8px",
                                        borderRadius: "6px",
                                        border: "1px solid var(--border)",
                                        background: "var(--bg-card)",
                                        color: "var(--text-secondary)",
                                        fontSize: 11,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        outline: "none",
                                    }}
                                >
                                    <option value="-1">Automático (HLS)</option>
                                    {hlsLevels.map((lvl) => (
                                        <option key={lvl.id} value={lvl.id}>
                                            {lvl.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Native PiP */}
                        {isPipSupported && (
                            <button
                                onClick={toggleNativePiP}
                                style={{
                                    marginLeft: "auto",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border)",
                                    background: "rgba(255,255,255,0.03)",
                                    color: "var(--text-secondary)",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                            >
                                <Minimize2 size={12} />
                                Pantalla en Pantalla (PiP)
                            </button>
                        )}
                    </div>
                )}

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

                        {programs && programs.length > 0 && (
                            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '12px' }}>
                                    <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>
                                        GUÍA DE PROGRAMACIÓN
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {programs
                                        .filter(p => p.stop > new Date())
                                        .slice(0, 4)
                                        .map((p, idx) => {
                                            const isCurrent = new Date() >= p.start && new Date() <= p.stop;
                                            return (
                                                <div 
                                                    key={idx} 
                                                    style={{ 
                                                        display: 'flex', 
                                                        flexDirection: 'column',
                                                        padding: '8px 12px', 
                                                        background: isCurrent ? 'rgba(124, 108, 252, 0.08)' : 'rgba(255,255,255,0.01)', 
                                                        borderRadius: '8px', 
                                                        border: isCurrent ? '1px solid var(--accent)' : '1px solid var(--border)',
                                                        transition: 'all 0.2s' 
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: 600, color: isCurrent ? 'var(--accent)' : 'var(--text-primary)' }}>
                                                            {isCurrent && "🔴 "} {p.title}
                                                        </span>
                                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0 }}>
                                                            {p.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {p.stop.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    {p.description && (
                                                        <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                            {p.description}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: "12px" }}>
                            Teclado: <kbd style={{ padding: "1px 5px", border: "1px solid var(--border)", borderRadius: 4 }}>Espacio</kbd> Play/Pausa ·{" "}
                            <kbd style={{ padding: "1px 5px", border: "1px solid var(--border)", borderRadius: 4 }}>F</kbd> Pantalla Completa ·{" "}
                            <kbd style={{ padding: "1px 5px", border: "1px solid var(--border)", borderRadius: 4 }}>Esc</kbd> Cerrar
                        </p>
                    </div>
                )}
            </div>

            {isShareModalOpen && (
                <div 
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        background: "rgba(0, 0, 0, 0.75)",
                        backdropFilter: "blur(8px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "16px",
                    }}
                    onClick={() => setIsShareModalOpen(false)}
                >
                    <div 
                        style={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                            borderRadius: "16px",
                            padding: "24px",
                            maxWidth: "420px",
                            width: "100%",
                            boxShadow: "var(--shadow-glow)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "20px",
                            animation: "scaleIn 0.2s ease-out",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Cast size={18} style={{ color: "var(--accent)" }} />
                                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Transmitir a la TV</h3>
                            </div>
                            <button 
                                onClick={() => setIsShareModalOpen(false)}
                                style={{
                                    background: "rgba(255,255,255,0.05)",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "28px",
                                    height: "28px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    color: "var(--text-secondary)",
                                }}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                            Selecciona una opción para reproducir <strong>{channel?.name}</strong> en tu pantalla grande:
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {/* Chromecast / Google Cast */}
                            <button
                                onClick={() => {
                                    triggerChromecast();
                                }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "12px",
                                    background: hoveredOption === 0 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                                    border: hoveredOption === 0 ? "1px solid var(--accent)" : "1px solid var(--border)",
                                    borderRadius: "12px",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    width: "100%",
                                }}
                                onMouseEnter={() => setHoveredOption(0)}
                                onMouseLeave={() => setHoveredOption(null)}
                            >
                                <div style={{ background: "rgba(99, 102, 241, 0.1)", borderRadius: "8px", padding: "8px", color: "#6366f1" }}>
                                    <Cast size={18} />
                                </div>
                                <div>
                                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-primary)" }}>Chromecast / Smart TV</div>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Transmitir a Google TV, Android TV o Chromecast</div>
                                </div>
                            </button>

                            {/* AirPlay */}
                            <button
                                onClick={() => {
                                    triggerAirPlay();
                                }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "12px",
                                    background: hoveredOption === 1 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                                    border: hoveredOption === 1 ? "1px solid var(--accent)" : "1px solid var(--border)",
                                    borderRadius: "12px",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    width: "100%",
                                }}
                                onMouseEnter={() => setHoveredOption(1)}
                                onMouseLeave={() => setHoveredOption(null)}
                            >
                                <div style={{ background: "rgba(34, 197, 94, 0.1)", borderRadius: "8px", padding: "8px", color: "#22c55e" }}>
                                    <Tv size={18} />
                                </div>
                                <div>
                                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-primary)" }}>Apple AirPlay</div>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Transmitir a Apple TV o pantallas compatibles</div>
                                </div>
                            </button>
                        </div>

                        {/* Escanear QR */}
                        {typeof window !== "undefined" && activeStreamUrl && (
                            <div style={{
                                borderTop: "1px solid var(--border)",
                                paddingTop: "16px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "10px",
                                textAlign: "center"
                            }}>
                                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Ver en Smart TV vía QR</div>
                                <div style={{
                                    background: "white",
                                    padding: "8px",
                                    borderRadius: "12px",
                                    display: "inline-block"
                                }}>
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                                            window.location.origin + "/?playUrl=" + encodeURIComponent(activeStreamUrl) + "&name=" + encodeURIComponent(channel?.name || "")
                                        )}`} 
                                        alt="Código QR"
                                        style={{ width: "130px", height: "130px", display: "block" }}
                                    />
                                </div>
                                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 10px", lineHeight: "1.4" }}>
                                    Escanea este código QR con tu celular o Smart TV para abrir el canal directamente.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
