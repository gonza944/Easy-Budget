import { UserSchema } from "~/types/user";
import { supabase } from "../supabaseConnection";

export default defineEventHandler(async (_event) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
