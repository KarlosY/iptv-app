import type { Stream } from "@/domain/entities";
import type { IStreamRepository } from "@/domain/repositories/IStreamRepository";

export class GetStreamsUseCase {
    constructor(private readonly streamRepository: IStreamRepository) { }

    async execute(channelId: string): Promise<Stream[]> {
        return this.streamRepository.getByChannelId(channelId);
    }

    async executeAll(): Promise<Stream[]> {
        return this.streamRepository.getAll();
    }
}
