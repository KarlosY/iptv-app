import type { Channel, Stream } from "@/domain/entities";

const DB_NAME = "iptv-db";
const DB_VERSION = 1;

export class IndexedDBService {
    private static db: IDBDatabase | null = null;

    private static openDb(): Promise<IDBDatabase> {
        if (this.db) return Promise.resolve(this.db);

        return new Promise((resolve, reject) => {
            if (typeof window === "undefined" || !window.indexedDB) {
                reject(new Error("IndexedDB is not supported on this platform."));
                return;
            }

            const request = window.indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error("IndexedDB failed to open:", request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(request.result);
            };

            request.onupgradeneeded = (event) => {
                const db = request.result;
                
                // Create channels store
                if (!db.objectStoreNames.contains("channels")) {
                    const channelStore = db.createObjectStore("channels", { keyPath: "id" });
                    channelStore.createIndex("playlistId", "playlistId", { unique: false });
                }

                // Create streams store (stores array of streams per channelId)
                if (!db.objectStoreNames.contains("streams")) {
                    const streamStore = db.createObjectStore("streams", { keyPath: "channelId" });
                    streamStore.createIndex("playlistId", "playlistId", { unique: false });
                }
            };
        });
    }

    public static async savePlaylistData(
        playlistId: string,
        channels: Channel[],
        streamsMap: Record<string, Stream[]>
    ): Promise<void> {
        const db = await this.openDb();

        return new Promise<void>((resolve, reject) => {
            // First clear any existing data for this playlist (to overwrite / sync correctly)
            const transaction = db.transaction(["channels", "streams"], "readwrite");
            const channelStore = transaction.objectStore("channels");
            const streamStore = transaction.objectStore("streams");

            transaction.onerror = () => reject(transaction.error);
            transaction.oncomplete = () => resolve();

            // Clear old data for this playlist
            const channelIndex = channelStore.index("playlistId");
            const streamIndex = streamStore.index("playlistId");

            channelIndex.openCursor(IDBKeyRange.only(playlistId)).onsuccess = (e) => {
                const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };

            streamIndex.openCursor(IDBKeyRange.only(playlistId)).onsuccess = (e) => {
                const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };

            // Save new channels
            for (const channel of channels) {
                channelStore.put({
                    ...channel,
                    playlistId,
                });
            }

            // Save new streams
            for (const [channelId, streams] of Object.entries(streamsMap)) {
                streamStore.put({
                    channelId,
                    playlistId,
                    streams,
                });
            }
        });
    }

    public static async deletePlaylistData(playlistId: string): Promise<void> {
        const db = await this.openDb();

        return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(["channels", "streams"], "readwrite");
            const channelStore = transaction.objectStore("channels");
            const streamStore = transaction.objectStore("streams");

            transaction.onerror = () => reject(transaction.error);
            transaction.oncomplete = () => resolve();

            const channelIndex = channelStore.index("playlistId");
            const streamIndex = streamStore.index("playlistId");

            channelIndex.openCursor(IDBKeyRange.only(playlistId)).onsuccess = (e) => {
                const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };

            streamIndex.openCursor(IDBKeyRange.only(playlistId)).onsuccess = (e) => {
                const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };
        });
    }

    public static async getAllCustomData(): Promise<{
        channels: Channel[];
        streamsMap: Record<string, Stream[]>;
    }> {
        try {
            const db = await this.openDb();
            
            const channels = await new Promise<Channel[]>((resolve, reject) => {
                const transaction = db.transaction("channels", "readonly");
                const store = transaction.objectStore("channels");
                const request = store.getAll();
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            const streamRecords = await new Promise<{ channelId: string; streams: Stream[] }[]>((resolve, reject) => {
                const transaction = db.transaction("streams", "readonly");
                const store = transaction.objectStore("streams");
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            const streamsMap: Record<string, Stream[]> = {};
            for (const record of streamRecords) {
                streamsMap[record.channelId] = record.streams;
            }

            return { channels, streamsMap };
        } catch (err) {
            console.warn("Failed to retrieve custom data from IndexedDB, returning empty lists:", err);
            return { channels: [], streamsMap: {} };
        }
    }
}
