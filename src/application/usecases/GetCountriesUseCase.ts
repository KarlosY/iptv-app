import type { Country } from "@/domain/entities";
import type { ICountryRepository } from "@/domain/repositories/ICountryRepository";

export class GetCountriesUseCase {
    constructor(private readonly countryRepository: ICountryRepository) { }

    async execute(): Promise<Country[]> {
        const countries = await this.countryRepository.getAll();
        return countries.sort((a, b) => a.name.localeCompare(b.name));
    }
}
