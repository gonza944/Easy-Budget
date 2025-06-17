export default defineNuxtPlugin(() => {
  const { loggedIn, user, session, fetch } = useUserSession()
  
  // Auto-refresh session when it's about to expire
  let refreshInterval: NodeJS.Timeout | null = null
  
  const startSessionWatcher = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
    
    refreshInterval = setInterval(async () => {
      if (!loggedIn.value || !session.value?.expiresAt) return
      
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = Number(session.value.expiresAt)
      
      // If Supabase token expires in less than 5 minutes, refresh it
      // Note: Our session lasts 1 year, but Supabase tokens expire ~1 hour
      if (!isNaN(expiresAt) && expiresAt - now < 300) {
        console.log('Session expires soon, auto-refreshing...')
        try {
          await fetch()
          console.log('Session refreshed successfully')
        } catch (error) {
          console.error('Failed to refresh session:', error)
        }
      }
    }, 60000) // Check every minute
  }
  
  const stopSessionWatcher = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }
  
  // Watch for authentication state changes
  watch(loggedIn, (isLoggedIn) => {
    if (isLoggedIn) {
      startSessionWatcher()
    } else {
      stopSessionWatcher()
    }
  }, { immediate: true })
  
  // Watch for user changes (in case of session refresh with different user data)
  watch(user, (newUser, oldUser) => {
    if (newUser && oldUser && newUser.id !== oldUser.id) {
      console.log('User changed, refreshing page to clear cached data...')
      // Refresh the page to ensure clean state for the new user
      reloadNuxtApp()
    }
  })
  
  // Clean up on unmount
  onBeforeUnmount(() => {
    stopSessionWatcher()
  })
}) 