import { supabase } from "../../supabaseConnection";
import { ExpensesArraySchema, ExpenseQuerySchema } from "~/types/expense";

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

    // Validate query parameters
    const query = getQuery(event);
    console.log(`[expenses] Raw query parameters:`, query);
    
    const validatedQuery = ExpenseQuerySchema.parse(query);
    console.log(`[expenses] Validated query parameters:`, validatedQuery);
    
    const { budget_id, category_id, start_date, end_date, date } = validatedQuery;

    console.log(`[expenses] User session:`, { userId: session.user?.id, email: session.user?.email });
    console.log(`[expenses] Processing request with filters:`, {
      budget_id: `${budget_id} (${typeof budget_id})`,
      category_id: category_id ? `${category_id} (${typeof category_id})` : 'none',
      start_date,
      end_date,
      date
    });

    // Build the query with base filters - add explicit user_id filter for RLS
    let supabaseQuery = supabase.from("expenses").select();
    
    // Apply user filter first (required for RLS)
    supabaseQuery = supabaseQuery.eq('user_id', session.user.id);
    console.log(`[expenses] Applied user_id filter: ${session.user.id}`);
    
    // Apply other filters
    supabaseQuery = supabaseQuery.eq('budget_id', budget_id);
    console.log(`[expenses] Applied budget_id filter: ${budget_id}`);
    
    if (category_id) {
      supabaseQuery = supabaseQuery.eq('category_id', category_id);
      console.log(`[expenses] Applied category_id filter: ${category_id}`);
    }
    
    // Apply date filters
    if (date) {
      // Use PostgreSQL's date casting to compare just the date portion of timestamp
      supabaseQuery = supabaseQuery.filter('date::date', 'eq', date);
      console.log(`[expenses] Applied date filter: ${date}`);
    } else if (start_date) {
      supabaseQuery = supabaseQuery.gte('date', start_date);
      console.log(`[expenses] Applied start_date filter: ${start_date}`);
      
      if (end_date) {
        supabaseQuery = supabaseQuery.lte('date', end_date);
        console.log(`[expenses] Applied end_date filter: ${end_date}`);
      }
    }

    // Order by date descending (newest first)
    supabaseQuery = supabaseQuery.order('date', { ascending: false });
    
    // Execute query
    console.log(`[expenses] Executing query...`);
    const { data, error } = await supabaseQuery;
    
    // Log the raw response
    console.log(`[expenses] Query response:`, {
      success: !error,
      error: error,
      dataLength: data?.length,
      firstFewRecords: data?.slice(0, 3),
      totalRecords: data?.length || 0
    });
    
    if (error) {
      console.error("[expenses] Database error fetching expenses:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch expenses from database",
      });
    }

    // If no expenses found, let's do a broader query to check if there are any expenses at all
    if (!data || data.length === 0) {
      console.log(`[expenses] No expenses found with current filters, checking for any expenses in the table...`);
      
      const { data: allExpenses, error: allExpensesError } = await supabase
        .from('expenses')
        .select('id, budget_id, category_id, date, name')
        .limit(10);
        
      console.log(`[expenses] Sample of all expenses in table:`, {
        success: !allExpensesError,
        sampleData: allExpenses,
        error: allExpensesError
      });
      
      // Also check if there are expenses for this specific budget_id
      const { data: budgetExpenses, error: budgetExpensesError } = await supabase
        .from('expenses')
        .select('id, budget_id, category_id, date, name')
        .eq('budget_id', budget_id)
        .limit(5);
        
      console.log(`[expenses] Expenses specifically for budget_id ${budget_id}:`, {
        success: !budgetExpensesError,
        sampleData: budgetExpenses,
        error: budgetExpensesError
      });
    }

    // Validate and return response
    const validatedData = ExpensesArraySchema.parse(data || []);
    console.log(`[expenses] Returning ${validatedData.length} validated expenses`);
    
    return validatedData;
    
  } catch (error) {
    console.error("Error in expenses GET endpoint:", error);
    
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