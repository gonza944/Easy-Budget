import { z } from "zod";

// Schema for category entity
export const CategorySchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().optional(),
  });
  
  // Schema for array of categories
  export const CategoriesArraySchema = z.array(CategorySchema);
  
  // Derive TypeScript types from Zod schemas
  export type Category = z.infer<typeof CategorySchema>;
  export type CategoriesResponse = z.infer<typeof CategoriesArraySchema>;