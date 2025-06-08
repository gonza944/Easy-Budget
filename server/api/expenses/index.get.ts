import { supabase } from "../../supabaseConnection";
import { ExpensesArraySchema, ExpenseQuerySchema } from "~/types/expense";

export default defineEventHandler(async (event) => {
  // Validate query parameters
  const query = getQuery(event);
  const validatedQuery = ExpenseQuerySchema.parse(query);
  
  const { budget_id, category_id, start_date, end_date, date } = validatedQuery;

  try {
    // Build the query with base filters
    let supabaseQuery = supabase.from("expenses").select();
    
    // Apply filters
    supabaseQuery = supabaseQuery.eq('budget_id', budget_id);
    
    if (category_id) {
      supabaseQuery = supabaseQuery.eq('category_id', category_id);
    }
    
    // Apply date filters
    if (date) {
      // Use PostgreSQL's date casting to compare just the date portion of timestamp
      supabaseQuery = supabaseQuery.filter('date::date', 'eq', date);
    } else if (start_date) {
      supabaseQuery = supabaseQuery.gte('date', start_date);
      
      if (end_date) {
        supabaseQuery = supabaseQuery.lte('date', end_date);
      }
    }

    // Order by date descending (newest first)
    supabaseQuery = supabaseQuery.order('date', { ascending: false });
    
    // Execute query
    const { data, error } = await supabaseQuery;
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Validate and return response
    return ExpensesArraySchema.parse(data);
    
  } catch (error) {
    return {
      statusCode: 500,
      body: { 
        message: "Failed to fetch expenses", 
        error: error instanceof Error ? error.message : String(error) 
      }
    };
  }
}); 