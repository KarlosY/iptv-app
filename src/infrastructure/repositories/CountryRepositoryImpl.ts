import type { Country } from "@/domain/entities";
import type { ICountryRepository } from "@/domain/repositories/ICountryRepository";
import { IPTVApiDataSource } from "@/infrastructure/datasources/IPTVApiDataSource";

export class CountryRepositoryImpl implements ICountryRepository {
    async getAll(): Promise<Country[]> {
        return IPTVApiDataSource.fetchCountries();
    }
}
