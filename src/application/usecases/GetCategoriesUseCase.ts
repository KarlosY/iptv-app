import type { Category } from "@/domain/entities";
import type { ICategoryRepository } from "@/domain/repositories/ICategoryRepository";

export class GetCategoriesUseCase {
    constructor(private readonly categoryRepository: ICategoryRepository) { }

    async execute(): Promise<Category[]> {
        const categories = await this.categoryRepository.getAll();
        return categories.sort((a, b) => a.name.localeCompare(b.name));
    }
}
