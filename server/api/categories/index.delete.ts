import { z } from 'zod';
import { supabase } from "../../supabaseConnection";

// Schema for deleting a category
export const DeleteCategorySchema = z.object({
  id: z.number(),
});

// Schema for the response body
export const DeleteResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional()
});

// Derive TypeScript types from Zod schemas
export type DeleteCategory = z.infer<typeof DeleteCategorySchema>;
export type DeleteResponse = z.infer<typeof DeleteResponseSchema>;

export default defineEventHandler(async (event) => {
  try {
    // Validate request body
    const validatedData = await readValidatedBody(event, DeleteCategorySchema.parse);
    const { id } = validatedData;

    // Check if category exists
    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .select('id')
      .eq('id', id)
      .single();

    if (categoryError || !categoryData) {
      throw createError({
        statusCode: 404,
        message: "Category not found",
      });
    }

    // Check if there are any expenses using this category
    const { count, error: countError } = await supabase
      .from("expenses")
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (countError) {
      throw createError({
        statusCode: 500,
        message: countError.message,
      });
    }

    if (count && count > 0) {
      throw createError({
        statusCode: 409,
        message: `Cannot delete: This category is used by ${count} expenses`,
      });
    }

    // Delete the category
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq('id', id);

    if (error) {
      throw createError({
        statusCode: 500,
        message: error.message,
      });
    }

    // Validate and return response
    const response: DeleteResponse = {
      success: true
    };
    
    return response;
  } catch (error) {
    console.error("Error deleting category:", error);
    
    // Ensure error response matches our schema
    const errorResponse: DeleteResponse = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
    
    return errorResponse;
  }
}); 