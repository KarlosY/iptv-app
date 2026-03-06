"use client";
import { useState, useMemo, useCallback } from "react";
import type { Channel, Stream } from "@/domain/entities";

export interface ChannelFilters {
    search: string;
    category: string;
    country: string;
}

export function useChannelFilter(
    channels: Channel[],
    streamsMap: Map<string, Stream[]>
) {
    const [filters, setFilters] = useState<ChannelFilters>({
        search: "",
        category: "",
        country: "",
    });

    const filteredChannels = useMemo(() => {
        return channels.filter((ch) => {
            if (ch.is_nsfw) return false;
            if (filters.category && !ch.categories.includes(filters.category)) return false;
            if (filters.country && ch.country?.toLowerCase() !== filters.country.toLowerCase()) return false;
            if (filters.search) {
                const q = filters.search.toLowerCase();
                const matches =
                    ch.name.toLowerCase().includes(q) ||
                    ch.alt_names.some((n) => n.toLowerCase().includes(q)) ||
                    (ch.network?.toLowerCase().includes(q) ?? false);
                if (!matches) return false;
            }
            return true;
        });
    }, [channels, filters]);

    // Only show channels that actually have at least one stream
    const channelsWithStreams = useMemo(
        () => filteredChannels.filter((ch) => (streamsMap.get(ch.id)?.length ?? 0) > 0),
        [filteredChannels, streamsMap]
    );

    const setSearch = useCallback((s: string) => setFilters((f) => ({ ...f, search: s })), []);
    const setCategory = useCallback((c: string) => setFilters((f) => ({ ...f, category: c })), []);
    const setCountry = useCallback((c: string) => setFilters((f) => ({ ...f, country: c })), []);
    const resetFilters = useCallback(
        () => setFilters({ search: "", category: "", country: "" }),
        []
    );

    return { filters, channelsWithStreams, filteredChannels, setSearch, setCategory, setCountry, resetFilters };
}
