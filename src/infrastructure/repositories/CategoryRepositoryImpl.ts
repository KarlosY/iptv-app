import type { Category } from "@/domain/entities";
import type { ICategoryRepository } from "@/domain/repositories/ICategoryRepository";
import { IPTVApiDataSource } from "@/infrastructure/datasources/IPTVApiDataSource";

export class CategoryRepositoryImpl implements ICategoryRepository {
    async getAll(): Promise<Category[]> {
        return IPTVApiDataSource.fetchCategories();
    }
}
