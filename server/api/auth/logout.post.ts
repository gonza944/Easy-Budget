import { supabase } from "../../supabaseConnection"

export default defineEventHandler(async (event) => {
  try {
    const { error } = await supabase.auth.signOut()
    await clearUserSession(event)

    if (error) {
      console.error("Supabase logout error:", error)
      // Don't throw here since we already cleared the local session
    }
    
    return { success: true }
  } catch (error) {
    console.error("Error during logout:", error)
    
    // Still try to clear the session even if there's an error
    try {
      await clearUserSession(event)
    } catch (clearError) {
      console.error("Error clearing session:", clearError)
    }
    
    return { success: true } // Always return success for logout
  }
}) 