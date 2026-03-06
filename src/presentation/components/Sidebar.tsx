"use client";
import React, { useState } from "react";
import { Tv, Globe, LayoutGrid, TrendingUp, Music, Gamepad2, Newspaper, Baby, Film, Zap, Trophy, ChevronDown, ChevronUp } from "lucide-react";
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
    onSelectCategory: (id: string) => void;
    onSelectCountry: (code: string) => void;
    totalChannels: number;
    filteredCount: number;
}

export function Sidebar({
    categories,
    countries,
    selectedCategory,
    selectedCountry,
    onSelectCategory,
    onSelectCountry,
    totalChannels,
    filteredCount,
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
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    <Tv size={18} color="white" />
                </div>
                <span className="sidebar-logo-text">IPTV Stream</span>
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
                        className={`sidebar-item ${selectedCategory === "" && selectedCountry === "" ? "active" : ""}`}
                        onClick={() => { onSelectCategory(""); onSelectCountry(""); }}
                    >
                        <Globe size={15} />
                        All Channels
                    </div>
                </div>

                {/* Categories */}
                <div className="sidebar-section">
                    <p className="sidebar-section-title">Categories</p>
                    {categories.map((cat) => (
                        <div
                            key={cat.id}
                            className={`sidebar-item ${selectedCategory === cat.id ? "active" : ""}`}
                            onClick={() => { onSelectCategory(cat.id); onSelectCountry(""); }}
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
                                onClick={() => { onSelectCountry(c.code); onSelectCategory(""); }}
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
        </aside>
    );
}
