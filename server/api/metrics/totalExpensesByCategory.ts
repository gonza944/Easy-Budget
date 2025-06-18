import { z } from "zod";
import { supabase } from "~/server/supabaseConnection";

const QuerySchema = z.object({
  budget_id: z.string().transform((val) => Number(val)),
});

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

    const query = getQuery(event);
    console.log(`[totalExpensesByCategory] Raw query parameters:`, query);
    
    const validatedQuery = QuerySchema.parse(query);
    console.log(`[totalExpensesByCategory] Validated query parameters:`, validatedQuery);
    
    const { budget_id } = validatedQuery;

    console.log(`[totalExpensesByCategory] User session:`, { userId: session.user?.id, email: session.user?.email });
    console.log(`[totalExpensesByCategory] Processing request for budget_id: ${budget_id} (type: ${typeof budget_id})`);

    // Query to get total expenses by category
    console.log(`[totalExpensesByCategory] Querying expenses with category join for budget_id: ${budget_id}`);
    
    const { data, error } = await supabase
      .from("expenses")
      .select(`
        amount,
        categories (
          name,
          id
        )
      `)
      .eq("budget_id", budget_id);

    // Log the raw response
    console.log(`[totalExpensesByCategory] Query response:`, {
      success: !error,
      error: error,
      dataLength: data?.length,
      firstFewRecords: data?.slice(0, 3),
      totalRecords: data?.length || 0
    });

    if (error) {
      console.error("[totalExpensesByCategory] Database error:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch expenses by category",
      });
    }

    console.log(`[totalExpensesByCategory] Found ${data?.length || 0} expenses for budget_id: ${budget_id}`);

    // If no expenses found, do broader queries for debugging
    if (!data || data.length === 0) {
      console.log(`[totalExpensesByCategory] No expenses found for budget_id ${budget_id}, checking for any expenses in the table...`);
      
      const { data: allExpenses, error: allExpensesError } = await supabase
        .from('expenses')
        .select('id, budget_id, category_id, amount')
        .limit(5);
        
      console.log(`[totalExpensesByCategory] Sample of all expenses in table:`, {
        success: !allExpensesError,
        sampleData: allExpenses,
        error: allExpensesError
      });

      // Also check categories table
      const { data: allCategories, error: allCategoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .limit(5);
        
      console.log(`[totalExpensesByCategory] Sample of all categories in table:`, {
        success: !allCategoriesError,
        sampleData: allCategories,
        error: allCategoriesError
      });
    }

    // Group expenses by category and calculate totals
    const categoryTotals = (data || []).reduce((acc: Record<string, { name: string, total: number, id: number }>, expense: any) => {
      const categoryName = expense.categories?.name || "Uncategorized";
      const categoryId = expense.categories?.id || 0;
      const amount = Number(expense.amount) || 0;
      
      if (!acc[categoryName]) {
        acc[categoryName] = { name: categoryName, total: 0, id: categoryId };
      }
      acc[categoryName].total += amount;
      
      return acc;
    }, {});

    console.log(`[totalExpensesByCategory] Category totals calculated:`, {
      categoryCount: Object.keys(categoryTotals).length,
      categories: Object.entries(categoryTotals).map(([name, data]) => ({
        name,
        total: data.total,
        id: data.id
      }))
    });

    // Convert to array format expected by frontend
    const result = Object.values(categoryTotals).map(category => ({
      name: category.name,
      total: category.total,
      id: category.id
    }));

    console.log(`[totalExpensesByCategory] Final result:`, {
      resultCount: result.length,
      totalAmount: result.reduce((sum, cat) => sum + cat.total, 0),
      result
    });

    return result;
    
  } catch (error) {
    console.error("[totalExpensesByCategory] Error:", error);
    
    // If it's already an H3Error, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      console.error("Validation error details:", error.message);
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid query parameters",
      });
    }
    
    // Generic error fallback
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
