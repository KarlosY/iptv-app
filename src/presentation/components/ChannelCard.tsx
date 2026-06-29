"use client";
import React, { useState } from "react";
import { Play, Tv, Heart } from "lucide-react";
import type { Channel, Stream } from "@/domain/entities";
import { usePlayer } from "@/presentation/context/PlayerContext";
import { useAppStore } from "@/presentation/store/useAppStore";
import { normalizeEpgName, getCurrentProgram } from "@/application/services/epgService";

interface ChannelCardProps {
    channel: Channel;
    streams: Stream[];
    isFavorite: boolean;
    onToggleFavorite: (id: string) => void;
}

export function ChannelCard({ channel, streams, isFavorite, onToggleFavorite }: ChannelCardProps) {
    const { openPlayer } = usePlayer();
    const [logoError, setLogoError] = useState(false);

    const epgData = useAppStore(s => s.epgData);

    const primaryCategory = channel.categories[0] ?? "general";
    const categoryLabel = primaryCategory.charAt(0).toUpperCase() + primaryCategory.slice(1);

    const countryFlag = channel.country
        ? String.fromCodePoint(
            ...[...channel.country.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
        )
        : "";

    const handleClick = () => {
        if (streams.length > 0) openPlayer(channel, streams);
    };

    const onlyHttp = streams.length > 0 && streams.every(s => s.url.startsWith("http://"));

    // Get current EPG program
    const normName = normalizeEpgName(channel.name);
    const programs = epgData[normName];
    const { current, progress } = getCurrentProgram(programs);

    return (
        <div className="channel-card" onClick={handleClick} title={channel.name}>
            {/* Logo area */}
            <div className="card-logo-wrapper">
                {channel.logo && !logoError ? (
                    <img
                        src={channel.logo}
                        alt={channel.name}
                        className="card-logo"
                        loading="lazy"
                        decoding="async"
                        onError={() => setLogoError(true)}
                    />
                ) : (
                    <div className="card-logo-fallback">
                        <Tv size={22} />
                    </div>
                )}

                {/* Favorite button */}
                <div
                    className="favorite-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(channel.id);
                    }}
                    style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        zIndex: 10,
                        background: isFavorite ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(4px)',
                        padding: '6px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        color: isFavorite ? '#ff4b4b' : 'white',
                    }}
                >
                    <Heart size={16} fill={isFavorite ? '#ff4b4b' : 'transparent'} />
                </div>

                {/* Play overlay on hover */}
                <div className="play-overlay">
                    <div className="play-btn-icon">
                        <Play size={18} fill="white" color="white" />
                    </div>
                </div>
            </div>

            {/* Card body */}
            <div className="card-body">
                <p className="card-name">{channel.name}</p>
                
                {current ? (
                    <div style={{ marginTop: '4px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-primary)', opacity: 0.9, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>🔴 En vivo:</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%', paddingLeft: 4 }} title={current.title}>
                                {current.title}
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', borderRadius: '2px', transition: 'width 0.5s ease-out' }} />
                        </div>
                    </div>
                ) : (
                    <div style={{ height: '17px' }} />
                )}

                <div className="card-meta">
                    {categoryLabel && (
                        <span className="badge badge-category">{categoryLabel}</span>
                    )}
                    {channel.country && (
                        <span className="badge badge-country">
                            {countryFlag} {channel.country.toUpperCase()}
                        </span>
                    )}
                    {onlyHttp && (
                        <span className="badge badge-http" title="Este canal usa señal HTTP (insegura). En sitios HTTPS (como Vercel) el navegador podría bloquearlo. Requiere configuración de contenido no seguro en tu navegador." style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.2)', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            ⚠️ HTTP
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
