import { supabase } from "../../supabaseConnection"

export default defineEventHandler(async (event) => {
  try {
    // Get current session from nuxt-auth-utils
    const currentSession = await getUserSession(event)
    
    if (!currentSession.user) {
      throw createError({
        statusCode: 401,
        statusMessage: "No active session"
      })
    }

    // Refresh the Supabase session
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      // Clear the session if refresh failed
      await clearUserSession(event)
      throw createError({
        statusCode: 401,
        statusMessage: error.message
      })
    }

    // Update the user session with fresh data if available
    if (data.user && data.session) {
      await setUserSession(event, {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User'
        },
        loggedInAt: currentSession.loggedInAt || Date.now(),
        // Store any additional session data
        expiresAt: data.session.expires_at,
        accessToken: data.session.access_token
      }, {
        // Set maxAge to one year (365 days)
        maxAge: 60 * 60 * 24 * 365 // 1 year in seconds
      })
    }

    return { 
      success: true, 
      user: data.user,
      expiresAt: data.session?.expires_at
    }
  } catch (error) {
    console.error("Error refreshing session:", error)
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to refresh session"
    })
  }
}) 