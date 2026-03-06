import type { Country } from "@/domain/entities";

export interface ICountryRepository {
    getAll(): Promise<Country[]>;
}
