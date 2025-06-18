import { testDatabaseConnection } from "../supabaseConnection";

export default defineEventHandler(async (event) => {
  try {
    const startTime = Date.now();
    
    // Test database connection
    const dbTest = await testDatabaseConnection();
    const responseTime = Date.now() - startTime;
    
    // Check environment variables
    const envCheck = {
      supabaseUrl: !!process.env.SUPABASE_URL,
      supabaseKey: !!process.env.SUPABASE_KEY,
      nodeEnv: process.env.NODE_ENV || 'unknown'
    };
    
    const health = {
      status: dbTest.success ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: dbTest,
      environment: envCheck,
      version: '1.0.0'
    };
    
    // Set appropriate status code
    setResponseStatus(event, dbTest.success ? 200 : 503);
    
    return health;
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    setResponseStatus(event, 503);
    
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      version: '1.0.0'
    };
  }
}); 