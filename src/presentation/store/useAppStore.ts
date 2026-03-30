import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Channel, Stream } from '@/domain/entities';

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
    showFavorites: boolean;
    showRecents: boolean;

    // Persisted arrays
    favorites: string[];
    recentChannelIds: string[];

    // Actions
    setSearch: (search: string) => void;
    setCategory: (category: string) => void;
    setCountry: (country: string) => void;
    setShowFavorites: (show: boolean) => void;
    setShowRecents: (show: boolean) => void;
    resetFilters: () => void;

    toggleFavorite: (channelId: string) => void;
    addRecentChannel: (channelId: string) => void;
    clearRecents: () => void;
    
    // Config state
    hasInitializedCountry: boolean;
    setHasInitializedCountry: (val: boolean) => void;

    // Security
    isAdultUnlocked: boolean;
    unlockAdult: () => void;

    // Custom Playlists (BYOC)
    customPlaylists: PlaylistCredentials[];
    addPlaylist: (playlist: PlaylistCredentials) => void;
    removePlaylist: (id: string) => void;
    
    // In-memory unified state (Not persisted directly via Zustand to save space)
    customChannels: Channel[];
    customStreamsMap: Record<string, Stream[]>;
    setCustomData: (channels: Channel[], streams: Record<string, Stream[]>) => void;
}

const MAX_RECENTS = 20;

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            search: "",
            category: "",
            country: "",
            showFavorites: false,
            showRecents: false,
            favorites: [],
            recentChannelIds: [],

            setSearch: (search) => set({ search }),
            setCategory: (category) => set({ category, showFavorites: false, showRecents: false }),
            setCountry: (country) => set({ country, showFavorites: false, showRecents: false }),
            setShowFavorites: (showFavorites) => set({ showFavorites, showRecents: false, category: "", country: "" }),
            setShowRecents: (showRecents) => set({ showRecents, showFavorites: false, category: "", country: "" }),
            resetFilters: () => set({ search: "", category: "", country: "", showFavorites: false, showRecents: false }),
            
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

            isAdultUnlocked: false,
            unlockAdult: () => set({ isAdultUnlocked: true }),

            customPlaylists: [],
            addPlaylist: (p) => set(s => ({ customPlaylists: [...s.customPlaylists, p] })),
            removePlaylist: (id) => set(s => ({ customPlaylists: s.customPlaylists.filter(p => p.id !== id) })),
            
            customChannels: [],
            customStreamsMap: {},
            setCustomData: (c, s) => set({ customChannels: c, customStreamsMap: s }),
        }),
        {
            name: 'iptv-storage',
            partialize: (state) => ({
                favorites: state.favorites,
                recentChannelIds: state.recentChannelIds,
                country: state.country,
                hasInitializedCountry: state.hasInitializedCountry,
                isAdultUnlocked: state.isAdultUnlocked,
                customPlaylists: state.customPlaylists,
            }),
        }
    )
);
