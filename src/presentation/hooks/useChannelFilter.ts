"use client";
import { useMemo, useDeferredValue } from "react";
import type { Channel, Stream } from "@/domain/entities";
import { useAppStore } from "../store/useAppStore";

export function useChannelFilter(
    channels: Channel[],
    streamsMap: Map<string, Stream[]>
) {
    const search = useAppStore(s => s.search);
    const category = useAppStore(s => s.category);
    const country = useAppStore(s => s.country);
    const showFavorites = useAppStore(s => s.showFavorites);
    const showRecents = useAppStore(s => s.showRecents);
    const favorites = useAppStore(s => s.favorites);
    const recentChannelIds = useAppStore(s => s.recentChannelIds);
    const isAdultUnlocked = useAppStore(s => s.isAdultUnlocked);

    const deferredSearch = useDeferredValue(search);

    const filteredChannels = useMemo(() => {
        const ADULT_KEYWORDS = ['xxx', 'adult', '18+'];

        const result = channels.filter((ch) => {
            const isAdultChannel = ch.is_nsfw || ch.categories.some(cat => ADULT_KEYWORDS.includes(cat.toLowerCase()));
            if (!isAdultUnlocked && isAdultChannel) return false;

            if (showFavorites && !favorites.includes(ch.id)) return false;
            if (showRecents && !recentChannelIds.includes(ch.id)) return false;

            if (category) {
                const categoryMatched = ch.categories.some(c => 
                    c === category || c.toLowerCase().replace(/[^a-z0-9]/g, '-') === category
                );
                if (!categoryMatched) return false;
            }
            if (country && ch.country?.toLowerCase() !== country.toLowerCase()) {
                // EXCEPTION: BYOC channels (which lack country) bypass the country filter
                if (!(ch.id.startsWith('custom_') && !ch.country)) {
                    return false;
                }
            }

            if (deferredSearch) {
                const q = deferredSearch.toLowerCase();
                const matches =
                    ch.name.toLowerCase().includes(q) ||
                    ch.alt_names.some((n) => n.toLowerCase().includes(q)) ||
                    (ch.network?.toLowerCase().includes(q) ?? false);
                if (!matches) return false;
            }
            return true;
        });

        if (showRecents) {
            // Sort by most recently viewed
            result.sort((a, b) => {
                const indexA = recentChannelIds.indexOf(a.id);
                const indexB = recentChannelIds.indexOf(b.id);
                return indexA - indexB;
            });
        }

        return result;
    }, [channels, category, country, showFavorites, showRecents, favorites, recentChannelIds, deferredSearch, isAdultUnlocked]);

    // Only show channels that actually have at least one stream
    const channelsWithStreams = useMemo(
        () => filteredChannels.filter((ch) => (streamsMap.get(ch.id)?.length ?? 0) > 0),
        [filteredChannels, streamsMap]
    );

    return { channelsWithStreams, filteredChannels };
}

