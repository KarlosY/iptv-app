"use client";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, Tv } from "lucide-react";
import type { Channel, Category, Country, Stream } from "@/domain/entities";
import { useChannelFilter } from "@/presentation/hooks/useChannelFilter";
import { useAppStore } from "@/presentation/store/useAppStore";
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

    const search = useAppStore(s => s.search);
    const category = useAppStore(s => s.category);
    const country = useAppStore(s => s.country);
    const showFavorites = useAppStore(s => s.showFavorites);
    const showRecents = useAppStore(s => s.showRecents);
    const favorites = useAppStore(s => s.favorites);

    const setSearch = useAppStore(s => s.setSearch);
    const setCategory = useAppStore(s => s.setCategory);
    const setCountry = useAppStore(s => s.setCountry);
    const setShowFavorites = useAppStore(s => s.setShowFavorites);
    const setShowRecents = useAppStore(s => s.setShowRecents);
    const resetFilters = useAppStore(s => s.resetFilters);
    const toggleFavorite = useAppStore(s => s.toggleFavorite);

    const { channelsWithStreams, filteredChannels } = useChannelFilter(channels, streamsMap);

    const [visibleCount, setVisibleCount] = useState(50);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Reset visible count when filters change or filtered channels change
    useEffect(() => {
        setVisibleCount(50);
    }, [search, category, country, showFavorites, showRecents, filteredChannels.length]);

    // Intersection Observer to load more channels
    useEffect(() => {
        if (!loadMoreRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) => Math.min(prev + 50, channelsWithStreams.length));
                }
            },
            { threshold: 0.1, rootMargin: "400px" }
        );

        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [channelsWithStreams.length]);

    const visibleChannels = channelsWithStreams.slice(0, visibleCount);

    return (
        <PlayerProvider>
            <div className="app-layout">
                {/* Sidebar */}
                <Sidebar
                    categories={categories}
                    countries={countries}
                    selectedCategory={category}
                    selectedCountry={country}
                    showFavorites={showFavorites}
                    showRecents={showRecents}
                    onSelectCategory={setCategory}
                    onSelectCountry={setCountry}
                    onShowFavorites={setShowFavorites}
                    onShowRecents={setShowRecents}
                    onResetFilters={resetFilters}
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
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Active filter pills */}
                        {(category || country || showFavorites || showRecents) && (
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                {category && (
                                    <span className="badge badge-category" style={{ cursor: "pointer" }} onClick={() => setCategory("")}>
                                        {category} ×
                                    </span>
                                )}
                                {country && (
                                    <span className="badge badge-country" style={{ cursor: "pointer" }} onClick={() => setCountry("")}>
                                        {country.toUpperCase()} ×
                                    </span>
                                )}
                                {showFavorites && (
                                    <span className="badge badge-category" style={{ cursor: "pointer", background: "rgba(255, 75, 75, 0.1)", color: "#ff4b4b", border: "1px solid rgba(255, 75, 75, 0.2)" }} onClick={() => setShowFavorites(false)}>
                                        Favorites ×
                                    </span>
                                )}
                                {showRecents && (
                                    <span className="badge badge-category" style={{ cursor: "pointer", background: "rgba(108, 99, 255, 0.1)", color: "var(--accent)", border: "1px solid rgba(108, 99, 255, 0.2)" }} onClick={() => setShowRecents(false)}>
                                        Recently Viewed ×
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
                        {(search || category || country) && (
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
                            {visibleChannels.map((channel) => (
                                <ChannelCard
                                    key={channel.id}
                                    channel={channel}
                                    streams={streamsMap.get(channel.id) ?? []}
                                    isFavorite={favorites.includes(channel.id)}
                                    onToggleFavorite={toggleFavorite}
                                />
                            ))}
                            {visibleCount < channelsWithStreams.length && (
                                <div ref={loadMoreRef} style={{ gridColumn: "1 / -1", height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* HLS Player modal */}
            <PlayerModal />
        </PlayerProvider>
    );
}
