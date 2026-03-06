"use client";
import React, { useState } from "react";
import { Play, Tv } from "lucide-react";
import type { Channel, Stream } from "@/domain/entities";
import { usePlayer } from "@/presentation/context/PlayerContext";

interface ChannelCardProps {
    channel: Channel;
    streams: Stream[];
}

export function ChannelCard({ channel, streams }: ChannelCardProps) {
    const { openPlayer } = usePlayer();
    const [logoError, setLogoError] = useState(false);

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

    return (
        <div className="channel-card" onClick={handleClick} title={channel.name}>
            {/* Logo area */}
            <div className="card-logo-wrapper">
                {channel.logo && !logoError ? (
                    <img
                        src={channel.logo}
                        alt={channel.name}
                        className="card-logo"
                        onError={() => setLogoError(true)}
                    />
                ) : (
                    <div className="card-logo-fallback">
                        <Tv size={22} />
                    </div>
                )}

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
                <div className="card-meta">
                    {categoryLabel && (
                        <span className="badge badge-category">{categoryLabel}</span>
                    )}
                    {channel.country && (
                        <span className="badge badge-country">
                            {countryFlag} {channel.country.toUpperCase()}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
