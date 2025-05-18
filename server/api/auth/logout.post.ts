import { supabase } from "../../supabaseConnection"

export default defineEventHandler(async (_event) => {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message
    })
  }
  return { success: true }
}) 