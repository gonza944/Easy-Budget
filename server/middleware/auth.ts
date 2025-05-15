import { getRequestURL } from "h3";
import { supabase } from "../supabaseConnection";

export default defineEventHandler(async (event) => {
  // Only check authentication for API POST requests
  const url = getRequestURL(event);

  // Only apply middleware to POST requests
  if (
    event.method !== "POST" ||
    !url.pathname.startsWith("/api/") ||
    url.pathname === "/api/login" ||
    url.pathname === "/api/logout"
  ) {
    return;
  }

  try {
    // Get user session from server-side utility
    const session = await getUserSession(event);
    
    // Check if user is authenticated
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized: Please log in",
      });
    }

    // Refresh Supabase session
    await supabase.auth.refreshSession();
  } catch (error) {
    console.error("Authentication error:", error);
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: Authentication failed",
    });
  }
});
