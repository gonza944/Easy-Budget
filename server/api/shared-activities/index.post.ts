import { createUserSupabaseClient } from "../../supabaseConnection";
import { 
  CreateSharedActivitySchema, 
  SharedActivityApiResponseSchema,
  type SharedActivityApiResponse,
  type Member 
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
    const createdMembers: Member[] = [];

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

      // 2. Handle members - create new ones or find existing ones
      for (const participant of participants) {
        let member: Member;

        if (participant.id) {
          // Existing member - verify it belongs to this user
          const { data: existingMember, error: memberError } = await userSupabase
            .from("members")
            .select("*")
            .eq("id", participant.id)
            .single();

          if (memberError || !existingMember) {
            throw createError({
              statusCode: 400,
              statusMessage: `Member with ID ${participant.id} not found or not accessible`,
            });
          }

          member = existingMember;
        } else {
          // New member - create it
          const { data: newMember, error: createMemberError } = await userSupabase
            .from("members")
            .insert({
              email: participant.email,
              display_name: participant.display_name,
              user_id: user.id,
              member_id: participant.member_id || null
            })
            .select()
            .single();

          if (createMemberError) {
            console.error("Error creating member:", createMemberError);
            throw createError({
              statusCode: 500,
              statusMessage: `Failed to create member: ${createMemberError.message}`,
            });
          }

          member = newMember;
        }

        createdMembers.push(member);

        // 3. Create activity participation
        const { error: participationError } = await userSupabase
          .from("activity_participations")
          .insert({
            activity_id: activityId,
            member_id: member.id,
            user_id: user.id
          });

        if (participationError) {
          console.error("Error creating activity participation:", participationError);
          throw createError({
            statusCode: 500,
            statusMessage: `Failed to add member to activity: ${participationError.message}`,
          });
        }
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
          is_active
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

      // Return success response
      const response: SharedActivityApiResponse = {
        success: true,
        data: completeActivity
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
