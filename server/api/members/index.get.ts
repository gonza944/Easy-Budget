import { createUserSupabaseClient } from "../../supabaseConnection";
import { z } from "zod";
import { MemberSchema } from "~/types/sharedExpenses";
import type { SessionUser } from "~/types/auth";

// Response schema for array of members
const MembersArraySchema = z.array(MemberSchema);

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
    
    // Cast to our session user type
    const user = session.user as SessionUser;

    const query = getQuery(event);
    const emailFilter = query.email as string | undefined;
    const displayNameFilter = query.display_name as string | undefined;

    // Get members created by the authenticated user
    let supabaseQuery = userSupabase
      .from("members")
      .select(`
        id,
        email,
        display_name,
        user_id,
        member_id,
        created_at,
        updated_at
      `)
      .eq("user_id", user.id) // Only show members created by this user
      .order("display_name", { ascending: true });

    // Apply email filter if provided
    if (emailFilter) {
      supabaseQuery = supabaseQuery.ilike("email", `%${emailFilter}%`);
    }

    // Apply display name filter if provided
    if (displayNameFilter) {
      supabaseQuery = supabaseQuery.ilike("display_name", `%${displayNameFilter}%`);
    }

    const { data, error } = await supabaseQuery;
    
    if (error) {
      console.error("Database error fetching members:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch members from database",
      });
    }

    // Validate and return response
    return MembersArraySchema.parse(data || []);
    
  } catch (error) {
    console.error("Error in members GET endpoint:", error);
    
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
