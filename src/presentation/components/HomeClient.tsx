"use client";
import React, { useMemo } from "react";
import { Search, SlidersHorizontal, Tv } from "lucide-react";
import type { Channel, Category, Country, Stream } from "@/domain/entities";
import { useChannelFilter } from "@/presentation/hooks/useChannelFilter";
import { ChannelCard } from "@/presentation/components/ChannelCard";
import { SkeletonGrid } from "@/presentation/components/SkeletonCard";
import { Sidebar } from "@/presentation/components/Sidebar";
import { PlayerModal } from "@/presentation/components/PlayerModal";
import { PlayerProvider } from "@/presentation/context/PlayerContext";

interface HomeClientProps {
    channels: Channel[];
    streams: Stream[];
    categories: Category[];
    countries: Country[];
}

export function HomeClient({ channels, streams, categories, countries }: HomeClientProps) {
    // Build a channel -> streams map for O(1) lookups
    const streamsMap = useMemo(() => {
        const map = new Map<string, Stream[]>();
        for (const s of streams) {
            if (!s.channel) continue;
            const arr = map.get(s.channel) ?? [];
            arr.push(s);
            map.set(s.channel, arr);
        }
        return map;
    }, [streams]);

    const {
        filters,
        channelsWithStreams,
        setSearch,
        setCategory,
        setCountry,
        resetFilters,
        filteredChannels,
    } = useChannelFilter(channels, streamsMap);

    return (
        <PlayerProvider>
            <div className="app-layout">
                {/* Sidebar */}
                <Sidebar
                    categories={categories}
                    countries={countries}
                    selectedCategory={filters.category}
                    selectedCountry={filters.country}
                    onSelectCategory={setCategory}
                    onSelectCountry={setCountry}
                    totalChannels={channels.filter(c => !c.is_nsfw && (streamsMap.get(c.id)?.length ?? 0) > 0).length}
                    filteredCount={channelsWithStreams.length}
                />

                {/* Main */}
                <div className="main-content">
                    {/* Header */}
                    <header className="header">
                        <div className="sidebar-logo-icon" style={{ flexShrink: 0 }}>
                            <Tv size={16} color="white" />
                        </div>

                        {/* Search */}
                        <div className="search-wrapper">
                            <Search size={15} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search channels, networks…"
                                className="search-input"
                                value={filters.search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Active filter pills */}
                        {(filters.category || filters.country) && (
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                {filters.category && (
                                    <span className="badge badge-category" style={{ cursor: "pointer" }} onClick={() => setCategory("")}>
                                        {filters.category} ×
                                    </span>
                                )}
                                {filters.country && (
                                    <span className="badge badge-country" style={{ cursor: "pointer" }} onClick={() => setCountry("")}>
                                        {filters.country.toUpperCase()} ×
                                    </span>
                                )}
                                <button
                                    onClick={resetFilters}
                                    style={{
                                        fontSize: 11, color: "var(--text-muted)", background: "none",
                                        border: "none", cursor: "pointer", fontFamily: "inherit",
                                    }}
                                >
                                    Clear all
                                </button>
                            </div>
                        )}

                        <div style={{ marginLeft: "auto" }}>
                            <SlidersHorizontal size={18} style={{ color: "var(--text-muted)" }} />
                        </div>
                    </header>

                    {/* Stats bar */}
                    <div className="stats-bar">
                        <div className="stat-item">
                            <span>Showing</span>
                            <span className="stat-value">{channelsWithStreams.length.toLocaleString('en-US')}</span>
                            <span>channels</span>
                        </div>
                        <div className="stats-dot" />
                        <div className="stat-item">
                            <span className="stat-value">{streams.length.toLocaleString('en-US')}</span>
                            <span>active streams</span>
                        </div>
                        {(filters.search || filters.category || filters.country) && (
                            <>
                                <div className="stats-dot" />
                                <div className="stat-item" style={{ color: "var(--accent)" }}>
                                    <span>Filtered from {filteredChannels.length.toLocaleString('en-US')} matches</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Channel grid */}
                    {channelsWithStreams.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <Tv size={32} />
                            </div>
                            <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-secondary)" }}>
                                No channels found
                            </p>
                            <p style={{ fontSize: "13px" }}>Try adjusting your filters or search term.</p>
                            <button
                                onClick={resetFilters}
                                style={{
                                    marginTop: 8, padding: "8px 20px", background: "var(--accent)",
                                    border: "none", borderRadius: "99px", color: "white",
                                    fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: "pointer",
                                }}
                            >
                                Reset filters
                            </button>
                        </div>
                    ) : (
                        <div className="channel-grid">
                            {channelsWithStreams.map((channel) => (
                                <ChannelCard
                                    key={channel.id}
                                    channel={channel}
                                    streams={streamsMap.get(channel.id) ?? []}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* HLS Player modal */}
            <PlayerModal />
        </PlayerProvider>
    );
}
