import { z } from "zod";

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  archived_at: z.string().nullable(),
});

export const CategoriesArraySchema = z.array(CategorySchema);

export const CreateCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required"),
  description: z.string().trim().optional(),
});

export const UpdateCategorySchema = z
  .object({
    id: z.number(),
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable().optional(),
    archived: z.boolean().optional(),
  })
  .refine(
    ({ name, description, archived }) =>
      name !== undefined || description !== undefined || archived !== undefined,
    "Provide at least one category field to update",
  );

export const CategoryResponseSchema = z.object({
  success: z.literal(true),
  data: CategorySchema,
});

export type Category = z.infer<typeof CategorySchema>;
export type CategoriesResponse = z.infer<typeof CategoriesArraySchema>;
export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
