import type { Channel } from "@/domain/entities";

export interface IChannelRepository {
    getAll(): Promise<Channel[]>;
    getById(id: string): Promise<Channel | null>;
}
