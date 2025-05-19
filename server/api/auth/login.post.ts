import { z } from 'zod'
import { supabase } from "../../supabaseConnection";

export const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse)

  // Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    throw createError({
      statusCode: 401,
      message: error.message || 'Bad credentials'
    })
  }

  // Set the user session in the cookie if authentication successful
  if (data.user) {
    await setUserSession(event, {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User'
      }
    })
    return { success: true }
  }
  
  throw createError({
    statusCode: 401,
    message: 'Bad credentials'
  })
}) 