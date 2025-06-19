import { z } from 'zod';
import { createUserSupabaseClient } from "../../supabaseConnection";

// Schema for creating a new category
export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
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
export type CreateCategory = z.infer<typeof CreateCategorySchema>;
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
    const validatedData = await readValidatedBody(event, CreateCategorySchema.parse);
    const { name, description } = validatedData;

    // Check if category with the same name already exists for this user
    const { data: existingCategory, error: checkError } = await userSupabase
      .from("categories")
      .select('id')
      .eq('name', name)
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
        message: "A category with this name already exists",
      });
    }

    // Insert the category
    const { data, error } = await userSupabase.from("categories").insert({
      name,
      description,
    }).select().single();

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
    console.error("Error creating category:", error);
    
    // Ensure error response matches our schema
    const errorResponse: CategoryResponse = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
    
    return errorResponse;
  }
}); 