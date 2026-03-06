import type { Category } from "@/domain/entities";

export interface ICategoryRepository {
    getAll(): Promise<Category[]>;
}
