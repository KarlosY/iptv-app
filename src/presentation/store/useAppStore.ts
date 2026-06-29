import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Channel, Stream } from '@/domain/entities';
import type { EpgProgram } from '@/application/services/epgService';

export interface PlaylistCredentials {
    id: string;
    name: string;
    url: string;
    type: 'm3u' | 'xtream';
    username?: string;
    password?: string;
}

interface AppState {
    // Filters
    search: string;
    category: string;
    country: string;
    language: string;
    showFavorites: boolean;
    showRecents: boolean;

    // Persisted arrays
    favorites: string[];
    recentChannelIds: string[];

    // Actions
    setSearch: (search: string) => void;
    setCategory: (category: string) => void;
    setCountry: (country: string) => void;
    setLanguage: (lang: string) => void;
    setShowFavorites: (show: boolean) => void;
    setShowRecents: (show: boolean) => void;
    resetFilters: () => void;

    toggleFavorite: (channelId: string) => void;
    addRecentChannel: (channelId: string) => void;
    clearRecents: () => void;
    
    // Config state
    hasInitializedCountry: boolean;
    setHasInitializedCountry: (val: boolean) => void;

    // Custom Playlists (BYOC)
    customPlaylists: PlaylistCredentials[];
    addPlaylist: (playlist: PlaylistCredentials) => void;
    removePlaylist: (id: string) => Promise<void>;
    syncPlaylist: (id: string) => Promise<void>;
    
    // In-memory unified state (Not persisted directly via Zustand to save space)
    customChannels: Channel[];
    customStreamsMap: Record<string, Stream[]>;
    setCustomData: (channels: Channel[], streams: Record<string, Stream[]>) => void;
    loadCustomDataFromIndexedDB: () => Promise<void>;

    // EPG State
    epgData: Record<string, EpgProgram[]>;
    epgUrl: string;
    isEpgLoading: boolean;
    setEpgUrl: (url: string) => void;
    loadEpg: (url?: string) => Promise<void>;
    clearEpg: () => void;
}

const MAX_RECENTS = 20;

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            search: "",
            category: "",
            country: "",
            language: "",
            showFavorites: false,
            showRecents: false,
            favorites: [],
            recentChannelIds: [],

            setSearch: (search) => set({ search }),
            setCategory: (category) => set({ category, showFavorites: false, showRecents: false }),
            setCountry: (country) => set({ country, showFavorites: false, showRecents: false }),
            setLanguage: (language) => set({ language, showFavorites: false, showRecents: false }),
            setShowFavorites: (showFavorites) => set({ showFavorites, showRecents: false, category: "", country: "", language: "" }),
            setShowRecents: (showRecents) => set({ showRecents, showFavorites: false, category: "", country: "", language: "" }),
            resetFilters: () => set({ search: "", category: "", country: "", language: "", showFavorites: false, showRecents: false }),
            
            hasInitializedCountry: false,
            setHasInitializedCountry: (val) => set({ hasInitializedCountry: val }),

            toggleFavorite: (channelId) => set((state) => {
                const isFav = state.favorites.includes(channelId);
                return {
                    favorites: isFav
                        ? state.favorites.filter(id => id !== channelId)
                        : [...state.favorites, channelId]
                };
            }),

            addRecentChannel: (channelId) => set((state) => {
                const filtered = state.recentChannelIds.filter(id => id !== channelId);
                return {
                    recentChannelIds: [channelId, ...filtered].slice(0, MAX_RECENTS)
                };
            }),

            clearRecents: () => set({ recentChannelIds: [] }),

            customPlaylists: [],
            addPlaylist: (p) => set(s => ({ customPlaylists: [...s.customPlaylists, p] })),
            removePlaylist: async (id) => {
                set(s => ({ customPlaylists: s.customPlaylists.filter(p => p.id !== id) }));
                const { IndexedDBService } = await import('@/infrastructure/datasources/IndexedDBService');
                await IndexedDBService.deletePlaylistData(id);
                // Reload in-memory custom data
                const { channels, streamsMap } = await IndexedDBService.getAllCustomData();
                set({ customChannels: channels, customStreamsMap: streamsMap });
            },
            syncPlaylist: async (id) => {
                const state = get();
                const playlist = state.customPlaylists.find(p => p.id === id);
                if (!playlist || playlist.type !== 'm3u') return;

                let text = '';
                try {
                    const directRes = await fetch(playlist.url);
                    if (directRes.ok) {
                        text = await directRes.text();
                    }
                } catch (e) {
                    console.warn(`[CORS] Direct fetch failed for ${playlist.url}, falling back to Proxy`);
                }
                
                if (!text) {
                    const b64 = btoa(unescape(encodeURIComponent(playlist.url)));
                    const proxyRes = await fetch(`/api/proxy?url=${b64}`);
                    if (proxyRes.ok) {
                        text = await proxyRes.text();
                    }
                }

                if (!text) {
                    throw new Error("Could not download playlist content.");
                }

                const { parseM3U } = await import('@/application/parsers/m3uParser');
                const { channels, streamsMap } = parseM3U(text, playlist.name);

                const { IndexedDBService } = await import('@/infrastructure/datasources/IndexedDBService');
                await IndexedDBService.savePlaylistData(playlist.id, channels, streamsMap);

                // Reload data
                await state.loadCustomDataFromIndexedDB();
            },
            
            customChannels: [],
            customStreamsMap: {},
            setCustomData: (c, s) => set({ customChannels: c, customStreamsMap: s }),
            loadCustomDataFromIndexedDB: async () => {
                if (typeof window === 'undefined') return;
                const { IndexedDBService } = await import('@/infrastructure/datasources/IndexedDBService');
                const { channels, streamsMap } = await IndexedDBService.getAllCustomData();
                set({ customChannels: channels, customStreamsMap: streamsMap });
            },

            epgData: {},
            epgUrl: "",
            isEpgLoading: false,
            
            setEpgUrl: (epgUrl) => set({ epgUrl }),
            clearEpg: () => set({ epgData: {}, epgUrl: "" }),
            loadEpg: async (url) => {
                const targetUrl = url || get().epgUrl;
                if (!targetUrl) return;
                
                set({ isEpgLoading: true });
                try {
                    let text = "";
                    // Try direct fetch
                    try {
                        const res = await fetch(targetUrl);
                        if (res.ok) text = await res.text();
                    } catch (e) {
                        console.warn("[EPG] Direct fetch failed, trying proxy");
                    }
                    
                    // Try proxy fallback
                    if (!text) {
                        const b64 = btoa(unescape(encodeURIComponent(targetUrl)));
                        const res = await fetch(`/api/proxy?url=${b64}`);
                        if (res.ok) text = await res.text();
                    }
                    
                    if (!text) {
                        throw new Error("No se pudo descargar la guía EPG.");
                    }
                    
                    const { parseXMLTV } = await import("@/application/services/epgService");
                    const parsed = parseXMLTV(text);
                    set({ epgData: parsed, epgUrl: targetUrl, isEpgLoading: false });
                } catch (err) {
                    console.error("EPG Load error:", err);
                    set({ isEpgLoading: false });
                    throw err;
                }
            },
        }),
        {
            name: 'iptv-storage',
            partialize: (state) => ({
                favorites: state.favorites,
                recentChannelIds: state.recentChannelIds,
                country: state.country,
                language: state.language,
                hasInitializedCountry: state.hasInitializedCountry,
                customPlaylists: state.customPlaylists,
                epgUrl: state.epgUrl,
            }),
        }
    )
);
