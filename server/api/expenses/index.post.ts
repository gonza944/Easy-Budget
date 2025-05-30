import { z } from 'zod';
import { supabase } from "../../supabaseConnection";
import { ExpenseCreateSchema, ExpenseSchema } from '~/types/expense';

// Define simplified session user type based on what's stored in the session
type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export default defineEventHandler(async (event) => {
  try {
    // Parse and validate request body
    const validatedData = await readValidatedBody(event, ExpenseCreateSchema.parse);
    
    // Get user session to attach user_id
    const session = await getUserSession(event);
    
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized: Please log in",
      });
    }
    
    // Cast to our session user type
    const user = session.user as SessionUser;
    
    // Insert expense into database with user_id
    const { data, error } = await supabase
      .from('expenses')
      .insert([{
        ...validatedData,
        user_id: user.id  // Use just the ID, not the whole user object
      }])
      .select();
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (!data || data.length === 0) {
      throw new Error('Failed to create expense: No data returned');
    }
    
    // Validate and return the created expense
    return ExpenseSchema.parse(data[0]);
    
  } catch (error) {
    console.log(error);
    return {
      statusCode: error instanceof z.ZodError ? 400 : 500,
      body: { 
        message: "Failed to create expense", 
        error: error instanceof Error ? error.message : String(error) 
      }
    };
  }
}); 