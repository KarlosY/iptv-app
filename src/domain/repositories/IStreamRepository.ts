import type { Stream } from "@/domain/entities";

export interface IStreamRepository {
    getAll(): Promise<Stream[]>;
    getByChannelId(channelId: string): Promise<Stream[]>;
}
