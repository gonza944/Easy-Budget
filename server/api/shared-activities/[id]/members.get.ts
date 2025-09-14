import { createUserSupabaseClient } from "../../../supabaseConnection";
import { z } from "zod";
import { MemberSchema } from "~/types/sharedExpenses";

// Response schema for array of members
const MembersArraySchema = z.array(MemberSchema);

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

    // Get all members from the activity
    const { data, error } = await userSupabase
      .from("activity_participations")
      .select(`
        member:members(
          id,
          email,
          display_name,
          user_id,
          created_at,
          updated_at
        )
      `)
      .eq('activity_id', Number(activityId))
      .order('member.display_name');
    
    if (error) {
      console.error("Database error fetching activity members:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch activity members from database",
      });
    }

    // Transform data to extract just the member objects
    const members = (data || []).map(item => item.member);

    // Validate and return response
    return MembersArraySchema.parse(members);
    
  } catch (error) {
    console.error("Error in activity members GET endpoint:", error);
    
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
