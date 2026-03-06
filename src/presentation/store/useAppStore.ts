import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
        }),
        {
            name: 'iptv-storage',
            partialize: (state) => ({
                favorites: state.favorites,
                recentChannelIds: state.recentChannelIds
            }),
        }
    )
);
