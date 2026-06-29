import React, { useState } from "react";
import { 
    Tv, Globe, LayoutGrid, TrendingUp, Music, 
    Gamepad2, Newspaper, Baby, Film, Zap, 
    Trophy, ChevronDown, ChevronUp, Heart, 
    Clock, RefreshCw, Trash2, Github, Languages
} from "lucide-react";
import type { Category, Country } from "@/domain/entities";
import { useAppStore } from "@/presentation/store/useAppStore";

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
    languages: { code: string; name: string }[];
    selectedCategory: string;
    selectedCountry: string;
    selectedLanguage: string;
    showFavorites: boolean;
    showRecents: boolean;
    onSelectCategory: (id: string) => void;
    onSelectCountry: (code: string) => void;
    onSelectLanguage: (code: string) => void;
    onShowFavorites: (show: boolean) => void;
    onShowRecents: (show: boolean) => void;
    onResetFilters: () => void;
    totalChannels: number;
    filteredCount: number;
    isOpen?: boolean;
    onClose?: () => void;
    onOpenImport?: () => void;
}

export function Sidebar({
    categories,
    countries,
    languages,
    selectedCategory,
    selectedCountry,
    selectedLanguage,
    showFavorites,
    showRecents,
    onSelectCategory,
    onSelectCountry,
    onSelectLanguage,
    onShowFavorites,
    onShowRecents,
    onResetFilters,
    totalChannels,
    filteredCount,
    isOpen = false,
    onClose,
    onOpenImport,
}: SidebarProps) {
    const [showAllCountries, setShowAllCountries] = useState(false);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [showAllLanguages, setShowAllLanguages] = useState(false);
    const [countrySearch, setCountrySearch] = useState("");
    const [syncingPlaylistId, setSyncingPlaylistId] = useState<string | null>(null);

    const customPlaylists = useAppStore(s => s.customPlaylists);
    const removePlaylist = useAppStore(s => s.removePlaylist);
    const syncPlaylist = useAppStore(s => s.syncPlaylist);

    // Filter out adult categories from categories list
    const ADULT_KEYWORDS = ['xxx', 'adult', '18+', 'erotic', 'hot', 'nsfw'];
    const safeCategories = categories.filter(cat => {
        const id = cat.id.toLowerCase();
        return !ADULT_KEYWORDS.some(k => id.includes(k) || cat.name.toLowerCase().includes(k));
    });

    const countriesList = countrySearch
        ? countries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
        : countries;

    const isSelectedCountryHidden = !showAllCountries && selectedCountry && !countriesList.slice(0, 15).some(c => c.code === selectedCountry);
    const effectiveShowAll = showAllCountries || isSelectedCountryHidden || countrySearch !== "";

    const displayedCountries = effectiveShowAll ? countriesList : countriesList.slice(0, 15);

    const handleSync = async (playlistId: string) => {
        setSyncingPlaylistId(playlistId);
        try {
            await syncPlaylist(playlistId);
            alert("Lista sincronizada con éxito.");
        } catch (err: any) {
            console.error(err);
            alert(`Error al sincronizar la lista: ${err.message || err}`);
        } finally {
            setSyncingPlaylistId(null);
        }
    };

    const handleRemove = async (playlistId: string) => {
        if (confirm("¿Estás seguro de que deseas eliminar esta lista de reproducción?")) {
            try {
                await removePlaylist(playlistId);
            } catch (err: any) {
                console.error(err);
                alert(`Error al eliminar la lista: ${err.message || err}`);
            }
        }
    };

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
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Canales</span>
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
                        <p className="sidebar-section-title">Navegación</p>
                        <div
                            className={`sidebar-item ${!showFavorites && !showRecents && selectedCategory === "" && selectedCountry === "" ? "active" : ""}`}
                            onClick={onResetFilters}
                        >
                            <Globe size={15} />
                            Todos los Canales
                        </div>
                        <div
                            className={`sidebar-item ${showFavorites ? "active" : ""}`}
                            onClick={() => onShowFavorites(true)}
                        >
                            <Heart size={15} color={showFavorites ? "#ff4b4b" : "currentColor"} />
                            Mis Favoritos
                        </div>
                        <div
                            className={`sidebar-item ${showRecents ? "active" : ""}`}
                            onClick={() => onShowRecents(true)}
                        >
                            <Clock size={15} color={showRecents ? "var(--accent)" : "currentColor"} />
                            Vistos Recientemente
                        </div>
                    </div>

                    {/* Action Import */}
                    <div style={{ padding: '0 12px 10px' }}>
                        <button 
                            onClick={onOpenImport}
                            style={{ 
                                width: '100%', 
                                padding: '12px', 
                                background: 'var(--gradient-accent)', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '12px', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontWeight: 700, 
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                                fontSize: '14px',
                                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.35)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}
                            className="btn-import-channels hover:scale-[1.02] active:scale-[0.98]"
                        >
                            + Añadir Lista
                        </button>
                    </div>

                    {/* Saved Playlists */}
                    {customPlaylists.length > 0 && (
                        <div className="sidebar-section">
                            <p className="sidebar-section-title">Mis Listas</p>
                            {customPlaylists.map((playlist) => (
                                <div
                                    key={playlist.id}
                                    className="sidebar-item"
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                >
                                    <span 
                                        style={{ 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis', 
                                            whiteSpace: 'nowrap', 
                                            maxWidth: '70%',
                                            fontSize: '13px'
                                        }} 
                                        title={playlist.name}
                                    >
                                        📺 {playlist.name}
                                    </span>
                                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                        {playlist.type === 'm3u' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSync(playlist.id);
                                                }}
                                                disabled={syncingPlaylistId === playlist.id}
                                                style={{ 
                                                    background: 'none', 
                                                    border: 'none', 
                                                    color: 'var(--text-muted)', 
                                                    cursor: syncingPlaylistId === playlist.id ? 'not-allowed' : 'pointer', 
                                                    padding: 4, 
                                                    display: 'flex', 
                                                    alignItems: 'center' 
                                                }}
                                                title="Sincronizar Lista"
                                            >
                                                <RefreshCw 
                                                    size={13} 
                                                    className={syncingPlaylistId === playlist.id ? 'spinner' : ''} 
                                                    style={{ 
                                                        animation: syncingPlaylistId === playlist.id ? "spin 1s linear infinite" : "none" 
                                                    }} 
                                                />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemove(playlist.id);
                                            }}
                                            style={{ 
                                                background: 'none', 
                                                border: 'none', 
                                                color: '#f87171', 
                                                cursor: 'pointer', 
                                                padding: 4, 
                                                display: 'flex', 
                                                alignItems: 'center' 
                                            }}
                                            title="Eliminar Lista"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Categories */}
                    <div className="sidebar-section">
                        <p className="sidebar-section-title">Categorías</p>
                        {(showAllCategories ? safeCategories : safeCategories.slice(0, 5)).map((cat) => (
                            <div
                                key={cat.id}
                                className={`sidebar-item ${selectedCategory === cat.id ? "active" : ""}`}
                                onClick={() => {
                                    if (selectedCategory === cat.id) {
                                        onSelectCategory("");
                                    } else {
                                        onSelectCategory(cat.id);
                                    }
                                }}
                            >
                                {CATEGORY_ICONS[cat.id] ?? <LayoutGrid size={15} />}
                                {cat.name}
                            </div>
                        ))}
                        {safeCategories.length > 5 && (
                            <button
                                onClick={() => setShowAllCategories(!showAllCategories)}
                                className="flex items-center gap-2 mt-1 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg border border-white/5"
                                style={{ margin: "4px auto 0", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}
                            >
                                {showAllCategories ? "Ver Menos" : `Ver Todos (${safeCategories.length})`}
                                <ChevronDown size={14} className={`transition-transform duration-300 ${showAllCategories ? "rotate-180" : ""}`} />
                            </button>
                        )}
                    </div>

                    {/* Languages */}
                    {languages && languages.length > 0 && (
                        <div className="sidebar-section">
                            <p className="sidebar-section-title">Idiomas</p>
                            {(showAllLanguages ? languages : languages.slice(0, 5)).map((lang) => (
                                <div
                                    key={lang.code}
                                    className={`sidebar-item ${selectedLanguage === lang.code ? "active" : ""}`}
                                    onClick={() => {
                                        if (selectedLanguage === lang.code) {
                                            onSelectLanguage("");
                                        } else {
                                            onSelectLanguage(lang.code);
                                        }
                                    }}
                                >
                                    <Languages size={15} />
                                    <span style={{ textTransform: "capitalize" }}>{lang.name}</span>
                                </div>
                            ))}
                            {languages.length > 5 && (
                                <button
                                    onClick={() => setShowAllLanguages(!showAllLanguages)}
                                    className="flex items-center gap-2 mt-1 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg border border-white/5"
                                    style={{ margin: "4px auto 0", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}
                                >
                                    {showAllLanguages ? "Ver Menos" : `Ver Todos (${languages.length})`}
                                    <ChevronDown size={14} className={`transition-transform duration-300 ${showAllLanguages ? "rotate-180" : ""}`} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Countries */}
                    <div className="sidebar-section">
                        <p className="sidebar-section-title">Países</p>
                        <div style={{ padding: "0 8px 12px" }}>
                            <input
                                type="text"
                                placeholder="Buscar país..."
                                value={countrySearch}
                                onChange={(e) => {
                                    setCountrySearch(e.target.value);
                                    setShowAllCountries(true);
                                }}
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    background: "var(--bg-card)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "8px",
                                    color: "var(--text-primary)",
                                    fontSize: "12.5px",
                                    outline: "none",
                                    fontFamily: "inherit"
                                }}
                            />
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
                                    <span style={{ fontSize: "14px", display: "flex", alignItems: "center" }}>{flag}</span>
                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", paddingTop: "1px" }}>{c.name}</span>
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
                                    <>Ver Menos <ChevronUp size={14} /></>
                                ) : (
                                    <>Ver Todos ({countries.length}) <ChevronDown size={14} /></>
                                )}
                            </div>
                        )}

                        {displayedCountries.length === 0 && countrySearch && (
                            <div style={{ padding: "8px", fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
                                No se encontraron países
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
