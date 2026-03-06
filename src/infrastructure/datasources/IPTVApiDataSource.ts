// Infrastructure: IPTV-org API Data Source
// Fetches raw data from https://iptv-org.github.io/api/
// Uses Next.js fetch caching (1 hour revalidate) to avoid hammering the API

import type { Channel, Stream, Category, Country } from "@/domain/entities";

const BASE_URL = "https://iptv-org.github.io/api";

async function fetchJSON<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
    });

    if (!res.ok) {
        throw new Error(`IPTV API error: ${res.status} ${res.statusText} for ${path}`);
    }

    return res.json() as Promise<T>;
}

export const IPTVApiDataSource = {
    fetchChannels: () => fetchJSON<Channel[]>("/channels.json"),
    fetchStreams: () => fetchJSON<Stream[]>("/streams.json"),
    fetchCategories: () => fetchJSON<Category[]>("/categories.json"),
    fetchCountries: () => fetchJSON<Country[]>("/countries.json"),
};
