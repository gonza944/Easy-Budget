import { z } from 'zod';
import { createUserSupabaseClient } from "../../supabaseConnection";

// Schema for updating a category
export const UpdateCategorySchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().optional()
});

// Schema for the response body
export const CategoryResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().optional(),
  }).optional(),
  error: z.string().optional()
});

// Derive TypeScript types from Zod schemas
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;

export default defineEventHandler(async (event) => {
  try {
    // Check authentication first
    const session = await getUserSession(event);
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized: Please log in",
      });
    }

    // Create authenticated Supabase client
    if (!session.accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: "No access token found in session",
      });
    }
    
    const userSupabase = createUserSupabaseClient(session.accessToken);

    // Validate request body
    const validatedData = await readValidatedBody(event, UpdateCategorySchema.parse);
    const { id, name, description } = validatedData;

    // Check if category exists
    const { data: categoryData, error: categoryError } = await userSupabase
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

    // If name is being updated, check for duplicates
    if (name) {
      const { data: existingCategory, error: checkError } = await userSupabase
        .from("categories")
        .select('id')
        .eq('name', name)
        .neq('id', id) // Exclude current category
        .maybeSingle();

      if (checkError) {
        throw createError({
          statusCode: 500,
          message: checkError.message,
        });
      }

      if (existingCategory) {
        throw createError({
          statusCode: 409,
          message: "Another category with this name already exists",
        });
      }
    }

    // Prepare update data
    const updateData: {name?: string; description?: string} = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    // Update the category
    const { data, error } = await userSupabase
      .from("categories")
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw createError({
        statusCode: 500,
        message: error.message,
      });
    }

    // Validate and return response
    const response: CategoryResponse = {
      success: true,
      data
    };
    
    return response;
  } catch (error) {
    console.error("Error updating category:", error);
    
    // Ensure error response matches our schema
    const errorResponse: CategoryResponse = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
    
    return errorResponse;
  }
}); 