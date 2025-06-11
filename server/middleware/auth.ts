import { getRequestURL } from "h3";

export default defineEventHandler(async (event) => {
  // Only check authentication for API POST requests
  const url = getRequestURL(event);

  // Only apply middleware to POST requests
  if (
    event.method !== "POST" ||
    !url.pathname.startsWith("/api/") ||
    url.pathname === "/api/auth/login" ||
    url.pathname === "/api/auth/logout" ||
    url.pathname === "/api/auth/refresh"
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

    // Session refresh is now handled by the session plugin hooks
    // No need to manually refresh here
  } catch (error) {
    console.error("Authentication error:", error);
    
    // Only throw auth error if it's not already an H3Error
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: Authentication failed",
    });
  }
});
