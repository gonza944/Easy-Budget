import { supabase } from '../supabaseConnection'

export default defineNitroPlugin(() => {
  // Called when the session is fetched during SSR for the Vue composable (/api/_auth/session)
  // Or when we call useUserSession().fetch()
  sessionHooks.hook('fetch', async (session, event) => {
    // If we have a session, check if the Supabase token needs refresh
    if (session.user && session.expiresAt) {
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = Number(session.expiresAt)
      
      // If Supabase token expires in less than 5 minutes, refresh it
      // Note: Our session lasts 1 year, but Supabase tokens expire ~1 hour
      if (expiresAt && !isNaN(expiresAt) && expiresAt - now < 300) {
        try {
          console.log('Session expires soon, refreshing...')
          const { data, error } = await supabase.auth.refreshSession()
          
          if (data.session && data.user && !error) {
            // Update the session with fresh data
            await setUserSession(event, {
              user: {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User'
              },
              loggedInAt: session.loggedInAt,
              expiresAt: data.session.expires_at,
              accessToken: data.session.access_token
            }, {
              // Set maxAge to one year (365 days)
              maxAge: 60 * 60 * 24 * 365 // 1 year in seconds
            })
            
            console.log('Session refreshed successfully')
          } else if (error) {
            console.error('Failed to refresh session:', error)
            // Clear the session if refresh failed
            await clearUserSession(event)
          }
        } catch (error) {
          console.error('Error during session refresh:', error)
          await clearUserSession(event)
        }
      }
    }
  })

  // Called when we call useUserSession().clear() or clearUserSession(event)
  sessionHooks.hook('clear', async (_session, _event) => {
    console.log('User session cleared')
    
    // Also sign out from Supabase when session is cleared
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out from Supabase:', error)
    }
  })
}) 