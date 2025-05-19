import { z } from 'zod';
import { supabase } from "../../supabaseConnection";

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

export default defineEventHandler(async () => {
  try {
    // Query categories
    const { data, error } = await supabase
      .from("categories")
      .select()
      .order('name');

    if (error) {
      throw new Error(error.message);
    }
    
    // Validate response with Zod schema
    const categories = CategoriesArraySchema.parse(data);
    return categories;
  } catch (error) {
    return {
      statusCode: 500,
      body: { 
        message: "Failed to fetch categories", 
        error: error instanceof Error ? error.message : String(error) 
      },
    };
  }
}); 