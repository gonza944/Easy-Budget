import { supabase } from "../../supabaseConnection";

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

    console.log(`[debug-expenses] Starting detailed expense investigation for user:`, {
      userId: session.user.id,
      email: session.user.email
    });

    const debugResults = {
      timestamp: new Date().toISOString(),
      user: {
        id: session.user.id,
        email: session.user.email
      },
      environment: {
        supabaseUrl: process.env.SUPABASE_URL,
        nodeEnv: process.env.NODE_ENV
      },
      tests: {} as Record<string, unknown>
    };

    // Test 1: Get ALL expenses with budget_id breakdown
    console.log(`[debug-expenses] Test 1: Get all expenses grouped by budget_id`);
    try {
      const { data: allExpenses, error: allExpensesError } = await supabase
        .from('expenses')
        .select('id, budget_id, amount, date, name, category_id')
        .order('budget_id')
        .order('id');
      
      const expensesByBudget = (allExpenses || []).reduce((acc, expense) => {
        const budgetId = expense.budget_id;
        if (!acc[budgetId]) acc[budgetId] = [];
        acc[budgetId].push(expense);
        return acc;
      }, {} as Record<number, unknown[]>);

      debugResults.tests.allExpensesByBudget = {
        success: !allExpensesError,
        error: allExpensesError?.message,
        totalExpenses: allExpenses?.length || 0,
        budgetBreakdown: Object.entries(expensesByBudget).map(([budgetId, expenses]) => ({
          budgetId: Number(budgetId),
          count: expenses.length,
          sampleExpenses: expenses.slice(0, 3)
        }))
      };
    } catch (error) {
      debugResults.tests.allExpensesByBudget = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 2: Specifically query for budget_id = 6
    console.log(`[debug-expenses] Test 2: Specifically query budget_id = 6`);
    try {
      const { data: budget6Expenses, error: budget6Error } = await supabase
        .from('expenses')
        .select('id, budget_id, amount, date, name, category_id')
        .eq('budget_id', 6)
        .order('id');
      
      debugResults.tests.budget6Specific = {
        success: !budget6Error,
        error: budget6Error?.message,
        count: budget6Expenses?.length || 0,
        expenses: budget6Expenses || []
      };
    } catch (error) {
      debugResults.tests.budget6Specific = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 3: Check if budget_id 6 exists and get its details
    console.log(`[debug-expenses] Test 3: Check budget_id = 6 details`);
    try {
      const { data: budget6Data, error: budget6DataError } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', 6)
        .single();
      
      debugResults.tests.budget6Details = {
        success: !budget6DataError,
        error: budget6DataError?.message,
        budget: budget6Data
      };
    } catch (error) {
      debugResults.tests.budget6Details = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 4: Raw count query for budget_id = 6
    console.log(`[debug-expenses] Test 4: Raw count for budget_id = 6`);
    try {
      const { count, error: countError } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .eq('budget_id', 6);
      
      debugResults.tests.budget6Count = {
        success: !countError,
        error: countError?.message,
        count: count
      };
    } catch (error) {
      debugResults.tests.budget6Count = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 5: Check for any RLS policies that might be filtering
    console.log(`[debug-expenses] Test 5: Check database connection details`);
    try {
      // Try a simple connection test
      const { data: connectionTest, error: connectionError } = await supabase
        .from('expenses')
        .select('count')
        .limit(1);
      
      debugResults.tests.connectionDetails = {
        success: !connectionError,
        error: connectionError?.message,
        result: connectionTest,
        supabaseClientDetails: {
          url: process.env.SUPABASE_URL?.substring(0, 50) + '...',
          hasKey: !!process.env.SUPABASE_KEY
        }
      };
    } catch (error) {
      debugResults.tests.connectionDetails = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 6: Get sample data with full details
    console.log(`[debug-expenses] Test 6: Get raw sample data`);
    try {
      const { data: sampleData, error: sampleError } = await supabase
        .from('expenses')
        .select('*')
        .limit(10)
        .order('id');
      
      debugResults.tests.rawSampleData = {
        success: !sampleError,
        error: sampleError?.message,
        sampleData: sampleData || []
      };
    } catch (error) {
      debugResults.tests.rawSampleData = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    console.log(`[debug-expenses] Debug results:`, debugResults);

    return debugResults;

  } catch (error) {
    console.error("[debug-expenses] Error:", error);
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
}); 