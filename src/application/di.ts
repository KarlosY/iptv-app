import { ChannelRepositoryImpl } from "@/infrastructure/repositories/ChannelRepositoryImpl";
import { StreamRepositoryImpl } from "@/infrastructure/repositories/StreamRepositoryImpl";
import { CategoryRepositoryImpl } from "@/infrastructure/repositories/CategoryRepositoryImpl";
import { CountryRepositoryImpl } from "@/infrastructure/repositories/CountryRepositoryImpl";

import { GetChannelsUseCase } from "@/application/usecases/GetChannelsUseCase";
import { GetStreamsUseCase } from "@/application/usecases/GetStreamsUseCase";
import { GetCategoriesUseCase } from "@/application/usecases/GetCategoriesUseCase";
import { GetCountriesUseCase } from "@/application/usecases/GetCountriesUseCase";

// Singleton container for dependencies
class DIContainer {
    private static instance: DIContainer;

    public readonly channelRepo: ChannelRepositoryImpl;
    public readonly streamRepo: StreamRepositoryImpl;
    public readonly categoryRepo: CategoryRepositoryImpl;
    public readonly countryRepo: CountryRepositoryImpl;

    public readonly getChannels: GetChannelsUseCase;
    public readonly getStreams: GetStreamsUseCase;
    public readonly getCategories: GetCategoriesUseCase;
    public readonly getCountries: GetCountriesUseCase;

    private constructor() {
        this.channelRepo = new ChannelRepositoryImpl();
        this.streamRepo = new StreamRepositoryImpl();
        this.categoryRepo = new CategoryRepositoryImpl();
        this.countryRepo = new CountryRepositoryImpl();

        this.getChannels = new GetChannelsUseCase(this.channelRepo);
        this.getStreams = new GetStreamsUseCase(this.streamRepo);
        this.getCategories = new GetCategoriesUseCase(this.categoryRepo);
        this.getCountries = new GetCountriesUseCase(this.countryRepo);
    }

    public static getInstance(): DIContainer {
        if (!DIContainer.instance) {
            DIContainer.instance = new DIContainer();
        }
        return DIContainer.instance;
    }
}

export const di = DIContainer.getInstance();
