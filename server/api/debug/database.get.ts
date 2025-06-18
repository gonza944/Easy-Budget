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

    console.log(`[debug] Starting comprehensive database debug for user:`, {
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
        supabaseUrl: process.env.SUPABASE_URL?.substring(0, 30) + '...',
        nodeEnv: process.env.NODE_ENV
      },
      tests: {} as Record<string, unknown>
    };

    // Test 1: Basic connection test
    console.log(`[debug] Test 1: Basic connection test`);
    try {
      const { data: connectionTest, error: connectionError } = await supabase
        .from('expenses')
        .select('count')
        .limit(1);
      
      debugResults.tests.basicConnection = {
        success: !connectionError,
        error: connectionError?.message,
        result: connectionTest
      };
    } catch (error) {
      debugResults.tests.basicConnection = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 2: Count expenses without RLS bypass
    console.log(`[debug] Test 2: Count expenses (with RLS)`);
    try {
      const { count, error: countError } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true });
      
      debugResults.tests.expensesCountWithRLS = {
        success: !countError,
        count: count,
        error: countError?.message
      };
    } catch (error) {
      debugResults.tests.expensesCountWithRLS = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 3: Try to get expenses with service role (bypasses RLS)
    console.log(`[debug] Test 3: Service role test (bypasses RLS)`);
    try {
      const serviceSupabase = supabase;
      const { data: serviceData, error: serviceError, count: serviceCount } = await serviceSupabase
        .from('expenses')
        .select('id, budget_id, amount, date, name', { count: 'exact' })
        .limit(5);
      
      debugResults.tests.serviceRoleTest = {
        success: !serviceError,
        count: serviceCount,
        sampleData: serviceData,
        error: serviceError?.message
      };
    } catch (error) {
      debugResults.tests.serviceRoleTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 4: Check budgets table access
    console.log(`[debug] Test 4: Budgets table access`);
    try {
      const { data: budgets, error: budgetsError, count: budgetCount } = await supabase
        .from('budgets')
        .select('id, name', { count: 'exact' })
        .limit(5);
      
      debugResults.tests.budgetsAccess = {
        success: !budgetsError,
        count: budgetCount,
        sampleData: budgets,
        error: budgetsError?.message
      };
    } catch (error) {
      debugResults.tests.budgetsAccess = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 5: Check categories table access
    console.log(`[debug] Test 5: Categories table access`);
    try {
      const { data: categories, error: categoriesError, count: categoryCount } = await supabase
        .from('categories')
        .select('id, name', { count: 'exact' })
        .limit(5);
      
      debugResults.tests.categoriesAccess = {
        success: !categoriesError,
        count: categoryCount,
        sampleData: categories,
        error: categoriesError?.message
      };
    } catch (error) {
      debugResults.tests.categoriesAccess = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 6: Try direct SQL query (if permissions allow)
    console.log(`[debug] Test 6: Direct SQL query test`);
    try {
      const { data: sqlResult, error: sqlError } = await supabase
        .rpc('get_table_info', { table_name: 'expenses' });
      
      debugResults.tests.directSQLTest = {
        success: !sqlError,
        result: sqlResult,
        error: sqlError?.message
      };
    } catch (error) {
      debugResults.tests.directSQLTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 7: Check if user has any data in any table
    console.log(`[debug] Test 7: Cross-table data check`);
    const userDataCheck: Record<string, unknown> = {};
    
    const tables = ['expenses', 'budgets', 'categories'];
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        userDataCheck[table] = {
          success: !error,
          count: count,
          error: error?.message
        };
      } catch (error) {
        userDataCheck[table] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    debugResults.tests.userDataCheck = userDataCheck;

    console.log(`[debug] Debug results:`, debugResults);

    return debugResults;

  } catch (error) {
    console.error("[debug] Database debug error:", error);
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
}); 