import type { Channel, Stream } from "@/domain/entities";

export function parseM3U(m3uText: string, providerName: string): { channels: Channel[], streamsMap: Record<string, Stream[]> } {
    const channels: Channel[] = [];
    const streamsMap: Record<string, Stream[]> = {};
    
    // Normalize line endings
    const lines = m3uText.replace(/\r\n/g, '\n').split('\n');
    let currentExtinf = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Match #EXTINF lines which contain metadata
        if (line.startsWith('#EXTINF:')) {
            currentExtinf = line;
        } else if (!line.startsWith('#') && currentExtinf) {
            // Line without # that follows an EXTINF is the actual streaming URL
            const url = line;
            
            // Extract attributes carefully
            const idMatch = currentExtinf.match(/tvg-id="([^"]*)"/);
            const logoMatch = currentExtinf.match(/tvg-logo="([^"]*)"/);
            const groupMatch = currentExtinf.match(/group-title="([^"]*)"/);
            
            // Channel Name is standardly placed after the last comma: #EXTINF:-1 tvg-id="..",Channel Name
            const nameMatch = currentExtinf.split(',').pop()?.trim() || 'Unknown Channel';
            
            // We use a synthetic ID based on URL or name to avoid collisions across providers
            const safeName = encodeURIComponent(nameMatch).replace(/%/g, '').substring(0, 15);
            const channelId = `custom_${safeName}_${Math.random().toString(36).substring(2, 7)}`;
            
            const categoryName = groupMatch ? groupMatch[1].trim() : (providerName || "Custom");
            
            channels.push({
                id: channelId,
                name: nameMatch,
                alt_names: [],
                network: providerName, // Group by provider
                owners: [],
                country: "", // Unknown from raw M3U usually
                subdivision: "",
                city: "",
                broadcast_area: [],
                languages: [],
                categories: [categoryName],
                is_nsfw: false, // Standard parsing does not enforce NSFW rules automatically
                launched: "",
                closed: "",
                replaced_by: "",
                website: "",
                logo: logoMatch ? logoMatch[1] : ""
            });
            
            streamsMap[channelId] = [{
                channel: channelId,
                feed: null,
                title: nameMatch,
                url: url,
                referrer: null,
                user_agent: null,
                quality: null,
                status: null,
                width: null,
                height: null,
                bitrate: null,
                frame_rate: null,
                added: new Date().toISOString(),
                updated: new Date().toISOString(),
                expires: null,
                is_closing: false
            }];
            
            // Reset state block for the next channel
            currentExtinf = '';
        }
    }
    
    return { channels, streamsMap };
}
