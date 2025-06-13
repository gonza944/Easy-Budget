export default defineEventHandler(async (event) => {
  try {
    // Get the user session from nuxt-auth-utils
    const session = await getUserSession(event)
    
    if (!session.user) {
      return { user: null, session: null }
    }

    return {
      user: session.user,
      session: session,
      loggedIn: true
    }
  } catch (error) {
    console.error("Error getting session:", error)
    return { user: null, session: null }
  }
}) 