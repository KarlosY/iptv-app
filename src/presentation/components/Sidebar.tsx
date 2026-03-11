import React, { useState } from "react";
import Link from "next/link";
import { Tv, Globe, LayoutGrid, TrendingUp, Music, Gamepad2, Newspaper, Baby, Film, Zap, Trophy, ChevronDown, ChevronUp, Heart, Clock, Github } from "lucide-react";
import type { Category, Country } from "@/domain/entities";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    news: <Newspaper size={15} />,
    sports: <Trophy size={15} />,
    music: <Music size={15} />,
    movies: <Film size={15} />,
    entertainment: <Zap size={15} />,
    kids: <Baby size={15} />,
    gaming: <Gamepad2 size={15} />,
    business: <TrendingUp size={15} />,
    general: <LayoutGrid size={15} />,
};

interface SidebarProps {
    categories: Category[];
    countries: Country[];
    selectedCategory: string;
    selectedCountry: string;
    showFavorites: boolean;
    showRecents: boolean;
    onSelectCategory: (id: string) => void;
    onSelectCountry: (code: string) => void;
    onShowFavorites: (show: boolean) => void;
    onShowRecents: (show: boolean) => void;
    onResetFilters: () => void;
    totalChannels: number;
    filteredCount: number;
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({
    categories,
    countries,
    selectedCategory,
    selectedCountry,
    showFavorites,
    showRecents,
    onSelectCategory,
    onSelectCountry,
    onShowFavorites,
    onShowRecents,
    onResetFilters,
    totalChannels,
    filteredCount,
    isOpen = false,
    onClose,
}: SidebarProps) {
    const [showAllCountries, setShowAllCountries] = useState(false);
    const [countrySearch, setCountrySearch] = useState("");

    const countriesList = countrySearch
        ? countries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
        : countries;

    // Si hay un país seleccionado que no está en los primeros 15, forzamos mostrar todos
    const isSelectedCountryHidden = !showAllCountries && selectedCountry && !countriesList.slice(0, 15).some(c => c.code === selectedCountry);
    const effectiveShowAll = showAllCountries || isSelectedCountryHidden || countrySearch !== "";

    const displayedCountries = effectiveShowAll ? countriesList : countriesList.slice(0, 15);

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div 
                    className="sidebar-backdrop" 
                    onClick={onClose}
                />
            )}
            
            <aside className={`sidebar ${isOpen ? "open" : ""}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <Tv size={18} color="white" />
                    </div>
                    <span className="sidebar-logo-text">IPTV Ykar</span>
                </div>

                {/* Stats */}
            <div
                style={{
                    padding: "12px 20px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Channels</span>
                <span
                    style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "var(--accent)",
                    }}
                >
                    {filteredCount.toLocaleString('en-US')} / {totalChannels.toLocaleString('en-US')}
                </span>
            </div>

            {/* Scrollable area */}
            <div className="sidebar-scroll">
                {/* All channels */}
                <div className="sidebar-section">
                    <p className="sidebar-section-title">Browse</p>
                    <div
                        className={`sidebar-item ${!showFavorites && !showRecents && selectedCategory === "" && selectedCountry === "" ? "active" : ""}`}
                        onClick={onResetFilters}
                    >
                        <Globe size={15} />
                        All Channels
                    </div>
                    <div
                        className={`sidebar-item ${showFavorites ? "active" : ""}`}
                        onClick={() => onShowFavorites(true)}
                    >
                        <Heart size={15} color={showFavorites ? "#ff4b4b" : "currentColor"} />
                        My Favorites
                    </div>
                    <div
                        className={`sidebar-item ${showRecents ? "active" : ""}`}
                        onClick={() => onShowRecents(true)}
                    >
                        <Clock size={15} color={showRecents ? "var(--accent)" : "currentColor"} />
                        Recently Viewed
                    </div>
                </div>

                {/* Categories */}
                <div className="sidebar-section">
                    <p className="sidebar-section-title">Categories</p>
                    {categories.map((cat) => (
                        <div
                            key={cat.id}
                            className={`sidebar-item ${selectedCategory === cat.id ? "active" : ""}`}
                            onClick={() => onSelectCategory(cat.id)}
                        >
                            {CATEGORY_ICONS[cat.id] ?? <LayoutGrid size={15} />}
                            {cat.name}
                        </div>
                    ))}
                </div>

                {/* Countries */}
                <div className="sidebar-section">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px 8px" }}>
                        <p className="sidebar-section-title" style={{ padding: 0 }}>Countries</p>
                    </div>

                    <div style={{ padding: "0 8px 12px" }}>
                        <div style={{ position: "relative" }}>
                            <input
                                type="text"
                                placeholder="Find country..."
                                value={countrySearch}
                                onChange={(e) => {
                                    setCountrySearch(e.target.value);
                                    setShowAllCountries(true); // Auto-expand when searching
                                }}
                                style={{
                                    width: "100%",
                                    padding: "6px 12px",
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "6px",
                                    color: "var(--text-primary)",
                                    fontSize: "12px",
                                    outline: "none",
                                    fontFamily: "inherit"
                                }}
                            />
                        </div>
                    </div>

                    {displayedCountries.map((c) => {
                        const flag =
                            c.code.length === 2
                                ? String.fromCodePoint(
                                    ...[...c.code.toUpperCase()].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65)
                                )
                                : "🌐";
                        return (
                            <div
                                key={c.code}
                                className={`sidebar-item ${selectedCountry === c.code ? "active" : ""}`}
                                onClick={() => onSelectCountry(c.code)}
                                title={c.name}
                            >
                                <span style={{ fontSize: "14px" }}>{flag}</span>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                            </div>
                        );
                    })}

                    {countriesList.length > 15 && !countrySearch && (
                        <div
                            className="sidebar-item"
                            style={{ justifyContent: "center", color: "var(--text-muted)", marginTop: 4 }}
                            onClick={() => setShowAllCountries(!showAllCountries)}
                        >
                            {effectiveShowAll ? (
                                <>Show Less <ChevronUp size={14} /></>
                            ) : (
                                <>Show All ({countries.length}) <ChevronDown size={14} /></>
                            )}
                        </div>
                    )}

                    {displayedCountries.length === 0 && countrySearch && (
                        <div style={{ padding: "8px", fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
                            No countries found
                        </div>
                    )}
                </div>
            </div>
                
            {/* Sidebar Footer (Sticky at bottom) */}
            <div style={{
                padding: "16px 20px",
                borderTop: "1px solid var(--border)",
                background: "var(--bg-sidebar)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                flexShrink: 0,
                zIndex: 10
            }}>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    Data provided by <a href="https://iptv-org.github.io/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>iptv-org</a>.
                </p>
                <div style={{ display: "flex", gap: "12px" }}>
                    <a href="https://github.com/iptv-org/iptv" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} title="GitHub">
                        <Github size={16} />
                    </a>
                    <a href="https://iptv-org.github.io/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} title="Website">
                        <Globe size={16} />
                    </a>
                </div>
                <div style={{ display: "flex", gap: "8px", fontSize: "10px", marginTop: "2px" }}>
                    <Link href="/terms" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Terms & Conditions</Link>
                    <span style={{ color: "var(--border)" }}>•</span>
                    <Link href="/privacy" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Privacy</Link>
                </div>
            </div>
            </aside>
        </>
    );
}
