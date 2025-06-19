import { UserSchema } from "~/types/user";
import { createUserSupabaseClient } from "../supabaseConnection";

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
    
    const userSupabase = createUserSupabaseClient(session.accessToken);

    const {
      data: { user },
    } = await userSupabase.auth.getUser();

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    // Validate user data with Zod schema
    const validatedUser = UserSchema.parse(user);
    return validatedUser;
  } catch (error) {
    console.error("Error fetching user:", error);
    return undefined;
  }
});
