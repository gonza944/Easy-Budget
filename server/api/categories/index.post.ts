import { requireSupabaseUser } from "~/server/utils/supabase";
import {
  CategoryResponseSchema,
  CreateCategorySchema,
  type CategoryResponse,
} from "~/types/category";

export default defineEventHandler(async (event) => {
  try {
    const { supabase: userSupabase } = await requireSupabaseUser(event);

    // Validate request body
    const validatedData = await readValidatedBody(event, (body) => {
      const result = CreateCategorySchema.safeParse(body);
      if (!result.success) {
        throw createError({
          statusCode: 400,
          statusMessage: result.error.issues[0]?.message || "Invalid category data",
        });
      }

      return result.data;
    });
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
        statusMessage: checkError.message,
      });
    }

    if (existingCategory) {
      throw createError({
        statusCode: 409,
        statusMessage: "A category with this name already exists",
      });
    }

    // Insert the category
    const { data, error } = await userSupabase
      .from("categories")
      .insert({ name, description: description || null })
      .select("id, name, description, archived_at")
      .single();

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      });
    }

    // Validate and return response
    const response: CategoryResponse = {
      success: true,
      data
    };

    return CategoryResponseSchema.parse(response);
  } catch (error) {
    console.error("Error creating category:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create category",
    });
  }
});
