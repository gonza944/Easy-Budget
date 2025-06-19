import { createUserSupabaseClient } from "../../supabaseConnection";
import { UpdateExpenseSchema } from '~/types/expense';
import type { ExpenseResponse, ExpenseUpdateData } from '~/types/expense';

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
    const validatedData = await readValidatedBody(event, UpdateExpenseSchema.parse);
    const { id, budget_id, category_id, ...otherUpdateData } = validatedData;

    // Check if expense exists
    const { data: expenseData, error: expenseError } = await userSupabase
      .from("expenses")
      .select('id')
      .eq('id', id)
      .single();

    if (expenseError || !expenseData) {
      throw createError({
        statusCode: 404,
        message: "Expense not found",
      });
    }

    // Prepare update data with proper type
    const updateData: ExpenseUpdateData = { ...otherUpdateData };
    
    // If budget_id is being updated, verify it exists
    if (budget_id) {
      const { data: budgetData, error: budgetError } = await userSupabase
        .from("budgets")
        .select('id')
        .eq('id', budget_id)
        .single();

      if (budgetError || !budgetData) {
        throw createError({
          statusCode: 404,
          message: "Budget not found",
        });
      }
      
      updateData.budget_id = budget_id;
    }

    // If category_id is being updated, verify it exists
    if (category_id) {
      const { data: categoryData, error: categoryError } = await userSupabase
        .from("categories")
        .select('id')
        .eq('id', category_id)
        .single();

      if (categoryError || !categoryData) {
        throw createError({
          statusCode: 404,
          message: "Category not found",
        });
      }
      
      updateData.category_id = category_id;
    }

    // Update the expense
    const { data, error } = await userSupabase
      .from("expenses")
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
    const response: ExpenseResponse = {
      success: true,
      data
    };
    
    return response;
  } catch (error) {
    console.error("Error updating expense:", error);
    
    // Ensure error response matches our schema
    const errorResponse: ExpenseResponse = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
    
    return errorResponse;
  }
}); 