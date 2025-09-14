import { createUserSupabaseClient } from "../../supabaseConnection";
import { 
  CreateSharedActivitySchema, 
  SharedActivityApiResponseSchema,
  type SharedActivityApiResponse,
} from "~/types/sharedExpenses";
import type { SessionUser } from "~/types/auth";

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
    const user = session.user as SessionUser;

    // Validate request body
    const validatedData = await readValidatedBody(event, CreateSharedActivitySchema.parse);
    const { name, description, participants } = validatedData;

    // Start a transaction-like approach by handling errors properly
    let activityId: number | undefined;

    try {
      // 1. Create the shared activity
      const { data: activityData, error: activityError } = await userSupabase
        .from("shared_activities")
        .insert({
          name,
          description: description || null,
          user_id: user.id,
          is_active: true
        })
        .select()
        .single();

      if (activityError) {
        console.error("Error creating shared activity:", activityError);
        throw createError({
          statusCode: 500,
          statusMessage: `Failed to create shared activity: ${activityError.message}`,
        });
      }

      activityId = activityData.id;

        // 2. Create all activity participations in bulk
        const participationData = participants.map(participant => ({
          activity_id: activityId,
          member_id: participant.id,
          user_id: user.id
        }));

        const { error: participationError } = await userSupabase
          .from("activity_participations")
          .insert(participationData);

        if (participationError) {
          console.error("Error creating activity participations:", participationError);
          throw createError({
            statusCode: 500,
            statusMessage: `Failed to add participants to activity: ${participationError.message}`,
          });
        }

      // 4. Fetch the complete activity with members for response
      const { data: completeActivity, error: fetchError } = await userSupabase
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
        .eq("id", activityId)
        .single();

      if (fetchError) {
        console.error("Error fetching created activity:", fetchError);
        throw createError({
          statusCode: 500,
          statusMessage: "Activity created but failed to fetch complete data",
        });
      }

      // Transform the response to match SharedActivityWithMembers format
      const activityWithMembers = {
        id: completeActivity.id,
        name: completeActivity.name,
        description: completeActivity.description,
        user_id: completeActivity.user_id,
        created_at: completeActivity.created_at,
        updated_at: completeActivity.updated_at,
        is_active: completeActivity.is_active,
        members: completeActivity.activity_participations?.map((participation: any) => participation.members) || []
      };

      // Return success response
      const response: SharedActivityApiResponse = {
        success: true,
        data: activityWithMembers
      };

      return SharedActivityApiResponseSchema.parse(response);

    } catch (error) {
      // If we created an activity but something failed later, we should clean up
      if (activityId !== undefined) {
        // Clean up in reverse order
        await userSupabase.from("activity_participations").delete().eq("activity_id", activityId);
        await userSupabase.from("shared_activities").delete().eq("id", activityId);
      }
      throw error; // Re-throw the original error
    }

  } catch (error) {
    console.error("Error in shared activities POST endpoint:", error);
    
    // If it's already an H3Error, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const response: SharedActivityApiResponse = {
        success: false,
        error: error.message || "Invalid data format"
      };
      
      setResponseStatus(event, 400);
      return SharedActivityApiResponseSchema.parse(response);
    }
    
    // Generic error fallback
    const response: SharedActivityApiResponse = {
      success: false,
      error: "Internal server error"
    };
    
    setResponseStatus(event, 500);
    return SharedActivityApiResponseSchema.parse(response);
  }
});
