import type { Stream } from "@/domain/entities";
import type { IStreamRepository } from "@/domain/repositories/IStreamRepository";
import { IPTVApiDataSource } from "@/infrastructure/datasources/IPTVApiDataSource";

export class StreamRepositoryImpl implements IStreamRepository {
    async getAll(): Promise<Stream[]> {
        return IPTVApiDataSource.fetchStreams();
    }

    async getByChannelId(channelId: string): Promise<Stream[]> {
        const streams = await this.getAll();
        return streams.filter((s) => s.channel === channelId);
    }
}
