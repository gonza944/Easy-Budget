import { UserSchema } from "~/types/user";
import { requireSupabaseUser } from "~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireSupabaseUser(event);

    // Validate user data with Zod schema
    const validatedUser = UserSchema.parse(user);
    return validatedUser;
  } catch (error) {
    console.error("Error fetching user:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch user",
    });
  }
});
