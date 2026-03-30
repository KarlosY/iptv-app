"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Tv, SlidersHorizontal, Menu, Sun, Moon, Info } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { Channel, Category, Country, Stream } from "@/domain/entities";
import { useChannelFilter } from "@/presentation/hooks/useChannelFilter";
import { useAppStore } from "@/presentation/store/useAppStore";
import { ChannelCard } from "@/presentation/components/ChannelCard";
import { SkeletonGrid } from "@/presentation/components/SkeletonCard";
import { Sidebar } from "@/presentation/components/Sidebar";
import { PlayerModal } from "@/presentation/components/PlayerModal";
import { PlayerProvider } from "@/presentation/context/PlayerContext";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { AboutModal } from "./AboutModal";
import { ImportModal } from "./ImportModal";
import { HeroBillboard } from "./HeroBillboard";
import { parseM3U } from "@/application/parsers/m3uParser";

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
    const hasInitializedCountry = useAppStore(s => s.hasInitializedCountry);
    const setHasInitializedCountry = useAppStore(s => s.setHasInitializedCountry);

    const customPlaylists = useAppStore(s => s.customPlaylists);
    const setCustomData = useAppStore(s => s.setCustomData);
    const customChannels = useAppStore(s => s.customChannels);
    const customStreamsMap = useAppStore(s => s.customStreamsMap);

    const [isParsingPlaylists, setIsParsingPlaylists] = useState(false);

    useEffect(() => {
        async function loadCustomPlaylists() {
            if (customPlaylists.length === 0) {
                setCustomData([], {});
                return;
            }
            setIsParsingPlaylists(true);
            let combinedChannels: Channel[] = [];
            const combinedStreams: Record<string, Stream[]> = {};
            
            for (const playlist of customPlaylists) {
                try {
                    // Evitamos problemas de unicode al cifrar base64
                    const b64 = btoa(unescape(encodeURIComponent(playlist.url)));
                    const res = await fetch(`/api/proxy?url=${b64}`);
                    if (!res.ok) continue;
                    const text = await res.text();
                    
                    const { channels: pChannels, streamsMap: pStreams } = parseM3U(text, playlist.name);
                    combinedChannels = [...combinedChannels, ...pChannels];
                    
                    // Mezclar colisiones
                    Object.keys(pStreams).forEach(key => {
                        combinedStreams[key] = pStreams[key];
                    });
                } catch (e) {
                    console.error("Failed to parse", playlist.name, e);
                }
            }
            setCustomData(combinedChannels, combinedStreams);
            setIsParsingPlaylists(false);
        }
        loadCustomPlaylists();
    }, [customPlaylists, setCustomData]);

    const allChannels = useMemo(() => [...channels, ...customChannels], [channels, customChannels]);
    
    const allStreamsMap = useMemo(() => {
        const merged = new Map(streamsMap);
        Object.entries(customStreamsMap).forEach(([id, streamArr]) => {
            const ext = merged.get(id) || [];
            merged.set(id, [...ext, ...streamArr]);
        });
        return merged;
    }, [streamsMap, customStreamsMap]);

    const { channelsWithStreams, filteredChannels } = useChannelFilter(allChannels, allStreamsMap);

    const dynamicCategories = useMemo(() => {
        const customCats = new Set<string>();
        customChannels.forEach(c => {
            c.categories.forEach(cat => {
                if (!categories.some(orig => orig.name === cat)) {
                    customCats.add(cat);
                }
            });
        });
        const extraCats: Category[] = Array.from(customCats).map(name => ({
            id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name
        }));
        return [...categories, ...extraCats];
    }, [categories, customChannels]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAboutOpen, setIsAboutOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [browserCountry, setBrowserCountry] = useState<string | null>(null);

    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
        try {
            const loc = navigator.language;
            if (loc && loc.includes('-')) {
                setBrowserCountry(loc.split('-')[1].toLowerCase());
            } else if (loc === 'es') {
                setBrowserCountry('es');
            }
        } catch (e) {}
    }, []);

    // Initial country detection via IP
    useEffect(() => {
        if (!hasInitializedCountry) {
            const fetchCountry = async () => {
                try {
                    const res = await fetch("https://get.geojs.io/v1/ip/country.json");
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.country) {
                            const code = data.country.toLowerCase();
                            if (countries.some(c => c.code === code)) {
                                setCountry(code);
                            }
                        }
                    }
                } catch (err) {
                    // Silently ignore if blocked by adblockers or browsers to avoid console errors
                } finally {
                    setHasInitializedCountry(true);
                }
            };
            fetchCountry();
        }
    }, [hasInitializedCountry, setCountry, setHasInitializedCountry, countries]);

    const heroChannels = useMemo(() => {
        // En caso de estar buscando algo o en listas especiales, NO mostrar Billboard.
        if (search || showFavorites || showRecents) return [];

        // Si ya hay un país filtrado u otra categoría, tomar de esa pool filtrada
        if (country || category) {
            return channelsWithStreams.slice(0, 5);
        }

        // Si el usuario no tiene filtros y vimos el código regional nativo de SO (PE, CL, ES, etc)
        if (browserCountry) {
            const local = channelsWithStreams.filter(c => c.country?.toLowerCase() === browserCountry);
            if (local.length > 0) return local.slice(0, 5);
        }

        // Fallback global final
        return channelsWithStreams.slice(0, 5);
    }, [search, showFavorites, showRecents, country, category, channelsWithStreams, browserCountry]);

    // --- Virtualization logic ---
    const parentRef = useRef<HTMLDivElement>(null);
    const [columns, setColumns] = useState(1);

    useEffect(() => {
        if (!parentRef.current) return;
        const observer = new ResizeObserver((entries) => {
            const containerWidth = entries[0].contentRect.width;
            const padding = 48; // 24px left + 24px right
            const gap = 16;
            const availableWidth = containerWidth - padding;
            
            // Adjust min column width based on breakpoints matching CSS
            const isLarge = window.innerWidth >= 1600;
            const isMobile = window.innerWidth <= 768;
            const minColWidth = isLarge ? 200 : (isMobile ? 120 : 180);
            
            const cols = Math.max(1, Math.floor((availableWidth + gap) / (minColWidth + gap)));
            setColumns(cols);
        });
        
        observer.observe(parentRef.current);
        return () => observer.disconnect();
    }, []);

    const rowCount = Math.ceil(channelsWithStreams.length / columns);
    
    // Estimate row height: width * 9/16 (image) + ~70px (body)
    const estimateRowHeight = () => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
        return isMobile ? 190 : 220;
    };

    const virtualizer = useWindowVirtualizer({
        count: rowCount,
        estimateSize: estimateRowHeight,
        overscan: 5,
    });

    return (
        <PlayerProvider>
            <div className="app-layout">
                {/* Sidebar */}
                <Sidebar
                    categories={dynamicCategories}
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
                    totalChannels={allChannels.length}
                    filteredCount={filteredChannels.length}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    onOpenImport={() => {
                        setIsSidebarOpen(false);
                        setIsImportModalOpen(true);
                    }}
                />

                {/* Main */}
                <div className="main-content">
                    {/* Header */}
                    <header className="header">
                        <button 
                            className="mobile-menu-btn" 
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={20} />
                        </button>
                        <div className="sidebar-logo-icon desktop-logo-icon" style={{ flexShrink: 0 }}>
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

                        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "16px" }}>
                            {mounted && (
                                <button
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "var(--text-muted)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "color 0.2s"
                                    }}
                                    title="Toggle Theme"
                                >
                                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                                </button>
                            )}
                            <button
                                onClick={() => setIsAboutOpen(true)}
                                style={{
                                    background: "transparent", border: "none", cursor: "pointer",
                                    color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.2s"
                                }}
                                title="About"
                            >
                                <Info size={18} />
                            </button>
                            <SlidersHorizontal size={18} style={{ color: "var(--text-muted)" }} />
                        </div>
                    </header>

                    {heroChannels.length > 0 && (
                        <HeroBillboard channels={heroChannels} streamsMap={streamsMap} />
                    )}

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
                        <div ref={parentRef} style={{ width: "100%", padding: "24px" }}>
                            <div
                                style={{
                                    height: `${virtualizer.getTotalSize()}px`,
                                    width: "100%",
                                    position: "relative",
                                }}
                            >
                                {virtualizer.getVirtualItems().map((virtualRow) => {
                                    const startIndex = virtualRow.index * columns;
                                    const rowChannels = channelsWithStreams.slice(startIndex, startIndex + columns);

                                    return (
                                        <div
                                            key={virtualRow.key}
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: `${virtualRow.size}px`,
                                                transform: `translateY(${virtualRow.start}px)`,
                                                display: "grid",
                                                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                                                gap: "16px",
                                                paddingBottom: "16px", // acts as row gap
                                            }}
                                        >
                                            {rowChannels.map((channel) => (
                                                <div key={channel.id} style={{ minWidth: 0, height: "100%" }}>
                                                    <ChannelCard
                                                        channel={channel}
                                                        streams={allStreamsMap.get(channel.id) ?? []}
                                                        isFavorite={favorites.includes(channel.id)}
                                                        onToggleFavorite={toggleFavorite}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* HLS Player modal */}
            <PlayerModal />

            {/* About Modal */}
            <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
            
            {/* Import / BYOC Modal */}
            <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
        </PlayerProvider>
    );
}
