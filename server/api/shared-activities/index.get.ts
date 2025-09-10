import { createUserSupabaseClient } from "../../supabaseConnection";
import { z } from "zod";
import { SharedActivityWithMembersSchema } from "~/types/sharedExpenses";

// Response schema for array of activities
const SharedActivitiesArraySchema = z.array(SharedActivityWithMembersSchema);

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
    
    const userSupabase = createUserSupabaseClient(session.accessToken as string);

    const query = getQuery(event);
    const nameFilter = query.name as string | undefined;

    // Get all shared activities where the user is a participant
    let supabaseQuery = userSupabase
      .from("shared_activities")
      .select(`
        id,
        name,
        description,
        user_id,
        created_at,
        updated_at,
        is_active,
        activity_participations!inner(
          members(
            id,
            email,
            display_name,
            user_id,
            member_id,
            created_at,
            updated_at
          )
        )
      `)
      .eq('is_active', true)
      .order("created_at", { ascending: false });

    // Apply name filter if provided
    if (nameFilter) {
      supabaseQuery = supabaseQuery.ilike("name", `%${nameFilter}%`);
    }

    const { data, error } = await supabaseQuery;
    
    if (error) {
      console.error("Database error fetching shared activities:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch shared activities from database",
      });
    }

    // Transform data to match expected schema
    const activitiesWithMembers = (data || []).map(activity => ({
      id: activity.id,
      name: activity.name,
      description: activity.description,
      user_id: activity.user_id,
      created_at: activity.created_at,
      updated_at: activity.updated_at,
      is_active: activity.is_active,
      members: activity.activity_participations.map(participation => participation.members)
    }));

    // Validate and return response
    return SharedActivitiesArraySchema.parse(activitiesWithMembers);
    
  } catch (error) {
    console.error("Error in shared activities GET endpoint:", error);
    
    // If it's already an H3Error, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: error.message,
      });
    }
    
    // Generic error fallback
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
