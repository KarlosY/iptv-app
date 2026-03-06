import type { Channel } from "@/domain/entities";
import type { IChannelRepository } from "@/domain/repositories/IChannelRepository";

export interface GetChannelsFilter {
    category?: string;
    country?: string;
    search?: string;
    excludeNsfw?: boolean;
}

export class GetChannelsUseCase {
    constructor(private readonly channelRepository: IChannelRepository) { }

    async execute(filter?: GetChannelsFilter): Promise<Channel[]> {
        const channels = await this.channelRepository.getAll();

        return channels.filter((ch) => {
            if (filter?.excludeNsfw && ch.is_nsfw) return false;
            if (filter?.category && !ch.categories.includes(filter.category)) return false;
            if (filter?.country && ch.country?.toLowerCase() !== filter.country.toLowerCase()) return false;
            if (filter?.search) {
                const q = filter.search.toLowerCase();
                const matches =
                    ch.name.toLowerCase().includes(q) ||
                    ch.alt_names.some((n) => n.toLowerCase().includes(q)) ||
                    ch.network?.toLowerCase().includes(q);
                if (!matches) return false;
            }
            return true;
        });
    }
}
