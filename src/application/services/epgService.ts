export interface EpgProgram {
    start: Date;
    stop: Date;
    title: string;
    description?: string;
}

// Normalize channel name for fuzzy matching
export function normalizeEpgName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "") // remove special characters
        .trim();
}

export function parseXMLTV(xmlText: string): Record<string, EpgProgram[]> {
    const epgData: Record<string, EpgProgram[]> = {};
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    // Map of channel id -> channel display names
    const channelMap: Record<string, string[]> = {};
    const channelNodes = xmlDoc.getElementsByTagName("channel");
    for (let i = 0; i < channelNodes.length; i++) {
        const node = channelNodes[i];
        const id = node.getAttribute("id");
        if (!id) continue;
        
        const displayNames: string[] = [];
        const nameNodes = node.getElementsByTagName("display-name");
        for (let j = 0; j < nameNodes.length; j++) {
            const val = nameNodes[j].textContent;
            if (val) displayNames.push(val.trim());
        }
        channelMap[id] = displayNames;
    }
    
    // Helper to parse XMLTV dates like: 20260629230000 +0200 or 20260629230000
    const parseXMLTVDate = (dateStr: string): Date => {
        const clean = dateStr.replace(/[^0-9+\-]/g, "");
        const year = parseInt(clean.substring(0, 4));
        const month = parseInt(clean.substring(4, 6)) - 1;
        const day = parseInt(clean.substring(6, 8));
        const hour = parseInt(clean.substring(8, 10));
        const min = parseInt(clean.substring(10, 12));
        const sec = parseInt(clean.substring(12, 14)) || 0;
        
        const offsetIndex = clean.search(/[+\-]/);
        if (offsetIndex !== -1) {
            const offsetSign = clean.substring(offsetIndex, offsetIndex + 1) === "+" ? 1 : -1;
            const offsetHours = parseInt(clean.substring(offsetIndex + 1, offsetIndex + 3));
            const offsetMins = parseInt(clean.substring(offsetIndex + 3, offsetIndex + 5)) || 0;
            
            const utcDate = new Date(Date.UTC(year, month, day, hour, min, sec));
            const offsetMs = ((offsetHours * 60) + offsetMins) * 60 * 1000 * offsetSign;
            return new Date(utcDate.getTime() - offsetMs);
        }
        
        return new Date(year, month, day, hour, min, sec);
    };
    
    const programmeNodes = xmlDoc.getElementsByTagName("programme");
    for (let i = 0; i < programmeNodes.length; i++) {
        const node = programmeNodes[i];
        const channelId = node.getAttribute("channel");
        const startStr = node.getAttribute("start");
        const stopStr = node.getAttribute("stop");
        
        if (!channelId || !startStr || !stopStr) continue;
        
        const titleNode = node.getElementsByTagName("title")[0];
        const descNode = node.getElementsByTagName("desc")[0];
        
        if (!titleNode) continue;
        
        const title = titleNode.textContent || "";
        const description = descNode ? descNode.textContent || "" : "";
        
        const start = parseXMLTVDate(startStr);
        const stop = parseXMLTVDate(stopStr);
        
        const program: EpgProgram = { start, stop, title, description };
        
        const names = channelMap[channelId] || [channelId];
        names.forEach(name => {
            const norm = normalizeEpgName(name);
            if (!epgData[norm]) {
                epgData[norm] = [];
            }
            epgData[norm].push(program);
        });
    }
    
    // Sort programmes by start time for each channel
    for (const key in epgData) {
        epgData[key].sort((a, b) => a.start.getTime() - b.start.getTime());
    }
    
    return epgData;
}

export function getCurrentProgram(programs: EpgProgram[] | undefined): { current: EpgProgram | null; next: EpgProgram | null; progress: number } {
    if (!programs || programs.length === 0) {
        return { current: null, next: null, progress: 0 };
    }
    const now = new Date();
    
    let current: EpgProgram | null = null;
    let next: EpgProgram | null = null;
    
    for (let i = 0; i < programs.length; i++) {
        const p = programs[i];
        if (now >= p.start && now <= p.stop) {
            current = p;
            next = programs[i + 1] || null;
            break;
        }
    }
    
    // If no exact match (e.g. program block missing), find next upcoming program
    if (!current) {
        for (let i = 0; i < programs.length; i++) {
            if (programs[i].start > now) {
                next = programs[i];
                break;
            }
        }
    }
    
    let progress = 0;
    if (current) {
        const total = current.stop.getTime() - current.start.getTime();
        const elapsed = now.getTime() - current.start.getTime();
        if (total > 0) {
            progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
        }
    }
    
    return { current, next, progress };
}
