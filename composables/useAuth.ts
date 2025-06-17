export const useAuth = () => {
  const { loggedIn, user, session, fetch, clear } = useUserSession()
  
  // Enhanced login state that includes session validation
  const isAuthenticated = computed(() => {
    if (!loggedIn.value || !user.value) return false
    
    // Check if session is expired
    if (session.value?.expiresAt) {
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = Number(session.value.expiresAt)
      
      if (!isNaN(expiresAt) && expiresAt <= now) {
        return false
      }
    }
    
    return true
  })
  
  // Reactive session expiry warning
  const sessionExpiresIn = computed(() => {
    if (!session.value?.expiresAt) return null
    
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = Number(session.value.expiresAt)
    
    if (isNaN(expiresAt)) return null
    
    const remainingSeconds = expiresAt - now
    return remainingSeconds > 0 ? remainingSeconds : 0
  })
  
  // Check if Supabase token expires within 5 minutes
  // Note: Our session lasts 1 year, but Supabase tokens expire ~1 hour
  const sessionExpiresSoon = computed(() => {
    return sessionExpiresIn.value !== null && sessionExpiresIn.value < 300
  })
  
  // Enhanced refresh that handles errors gracefully
  const refreshSession = async () => {
    try {
      await fetch()
      return true
    } catch (error) {
      console.error('Failed to refresh session:', error)
      // Clear session if refresh fails
      await logout()
      return false
    }
  }
  
  // Enhanced logout that calls the API
  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error during API logout:', error)
    }
    
    await clear()
  }
  
  // Login function
  const login = async (credentials: { email: string; password: string }) => {
    try {
      const result = await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials
      })
      
      if (result.success) {
        await refreshSession()
        return { success: true, user: result.user }
      }
      
      return { success: false, error: 'Login failed' }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      }
    }
  }
  
  // Auto-refresh session when it's about to expire
  const startSessionWatcher = () => {
    const intervalId = setInterval(async () => {
      if (sessionExpiresSoon.value && isAuthenticated.value) {
        console.log('Session expires soon, auto-refreshing...')
        await refreshSession()
      }
    }, 60000) // Check every minute
    
    // Return cleanup function
    return () => clearInterval(intervalId)
  }
  
  return {
    // State
    loggedIn,
    user,
    session,
    isAuthenticated,
    sessionExpiresIn,
    sessionExpiresSoon,
    
    // Actions
    login,
    logout,
    refreshSession,
    startSessionWatcher
  }
} 