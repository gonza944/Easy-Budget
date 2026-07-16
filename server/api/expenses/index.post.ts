import { z } from 'zod';
import { requireSupabaseUser } from "~/server/utils/supabase";
import { ExpenseCreateSchema, ExpenseSchema } from '~/types/expense';

export default defineEventHandler(async (event) => {
  try {
    // Parse and validate request body
    const validatedData = await readValidatedBody(event, ExpenseCreateSchema.parse);
    const { supabase: userSupabase, user } = await requireSupabaseUser(event);
    
    // Insert expense into database with user_id
    const { data, error } = await userSupabase
      .from('expenses')
      .insert([{
        ...validatedData,
        user_id: user.id  // Use just the ID, not the whole user object
      }])
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (!data) throw createError({ statusCode: 500, statusMessage: 'Failed to create expense: No data returned' });

    return ExpenseSchema.parse(data);
    
  } catch (error) {
    console.error("Error creating expense:", error);

    if (error && typeof error === "object" && "statusCode" in error) throw error;

    throw createError({
      statusCode: error instanceof z.ZodError ? 400 : 500,
      statusMessage: error instanceof z.ZodError ? "Invalid expense data" : "Failed to create expense",
    });
  }
});
