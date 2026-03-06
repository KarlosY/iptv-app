import type { Channel } from "@/domain/entities";
import type { IChannelRepository } from "@/domain/repositories/IChannelRepository";
import { IPTVApiDataSource } from "@/infrastructure/datasources/IPTVApiDataSource";

export class ChannelRepositoryImpl implements IChannelRepository {
    async getAll(): Promise<Channel[]> {
        return IPTVApiDataSource.fetchChannels();
    }

    async getById(id: string): Promise<Channel | null> {
        const channels = await this.getAll();
        return channels.find((c) => c.id === id) ?? null;
    }
}
