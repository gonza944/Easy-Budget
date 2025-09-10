import { createUserSupabaseClient } from "../../../supabaseConnection";
import { z } from "zod";
import { SettlementTransactionWithMembersSchema } from "~/types/sharedExpenses";

// Response schema for array of settlements
const SettlementsArraySchema = z.array(SettlementTransactionWithMembersSchema);

export default defineEventHandler(async (event) => {
  try {
    const activityId = getRouterParam(event, 'id');
    
    if (!activityId || isNaN(Number(activityId))) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid activity ID",
      });
    }

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
    
    const userSupabase = createUserSupabaseClient(session.accessToken as string);

    // Get all settlement transactions from the activity with member info
    const { data, error } = await userSupabase
      .from("settlement_transactions")
      .select(`
        id,
        activity_id,
        payer_member_id,
        payee_member_id,
        amount,
        settlement_date,
        notes,
        settlement_method,
        created_at,
        payer_member:members!payer_member_id(
          id,
          email,
          display_name,
          user_id,
          created_at,
          updated_at
        ),
        payee_member:members!payee_member_id(
          id,
          email,
          display_name,
          user_id,
          created_at,
          updated_at
        )
      `)
      .eq('activity_id', Number(activityId))
      .order('settlement_date', { ascending: false });
    
    if (error) {
      console.error("Database error fetching settlements:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch settlements from database",
      });
    }

    // Validate and return response
    return SettlementsArraySchema.parse(data || []);
    
  } catch (error) {
    console.error("Error in settlements GET endpoint:", error);
    
    // If it's already an H3Error, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid data format",
      });
    }
    
    // Generic error fallback
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
