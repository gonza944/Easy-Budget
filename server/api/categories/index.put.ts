import { requireSupabaseUser } from "~/server/utils/supabase";
import {
  CategoryResponseSchema,
  UpdateCategorySchema,
  type CategoryResponse,
} from "~/types/category";

export default defineEventHandler(async (event) => {
  try {
    const { supabase: userSupabase } = await requireSupabaseUser(event);

    // Validate request body
    const validatedData = await readValidatedBody(event, (body) => {
      const result = UpdateCategorySchema.safeParse(body);
      if (!result.success) {
        throw createError({
          statusCode: 400,
          statusMessage: result.error.issues[0]?.message || "Invalid category data",
        });
      }

      return result.data;
    });
    const { id, name, description, archived } = validatedData;

    // Check if category exists
    const { data: categoryData, error: categoryError } = await userSupabase
      .from("categories")
      .select('id')
      .eq('id', id)
      .single();

    if (categoryError || !categoryData) {
      throw createError({
        statusCode: 404,
        statusMessage: "Category not found",
      });
    }

    // If name is being updated, check for duplicates
    if (name !== undefined) {
      const { data: existingCategory, error: checkError } = await userSupabase
        .from("categories")
        .select('id')
        .eq('name', name)
        .neq('id', id) // Exclude current category
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
          statusMessage: "Another category with this name already exists",
        });
      }
    }

    // Prepare update data
    const updateData: {
      name?: string;
      description?: string | null;
      archived_at?: string | null;
    } = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (archived !== undefined) {
      updateData.archived_at = archived ? new Date().toISOString() : null;
    }

    // Update the category
    const { data, error } = await userSupabase
      .from("categories")
      .update(updateData)
      .eq('id', id)
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
    console.error("Error updating category:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update category",
    });
  }
});
