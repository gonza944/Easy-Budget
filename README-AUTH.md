# Authentication Setup

This project uses `nuxt-auth-utils` with Supabase for authentication. The system has been refactored to prevent auth desynchronization issues.

## Environment Setup

Make sure you have the following environment variables configured:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_KEY=your_supabase_anon_key_here

# Session Configuration (required for nuxt-auth-utils)
# Generate a secure password with at least 32 characters
NUXT_SESSION_PASSWORD=your-session-password-with-at-least-32-characters-here
```

You can generate a secure session password using:
```bash
openssl rand -base64 32
```

## Features

### Enhanced Session Management
- **Long-lasting sessions**: Sessions last for one year (365 days) for better user experience
- **Automatic token refresh**: Supabase tokens are automatically refreshed when they're about to expire (within 5 minutes)
- **Server-side session hooks**: Session validation and refresh happen server-side for better security
- **Client-side session watcher**: Monitors token expiry and handles automatic refresh
- **Synchronized logout**: Clears both client and server sessions properly

### Improved Auth Endpoints

- `POST /api/auth/login` - Enhanced login with proper session management
- `POST /api/auth/logout` - Comprehensive logout that clears all sessions
- `POST /api/auth/refresh` - Manual session refresh endpoint
- `GET /api/auth/session` - Get current session status

### Better Error Handling
- Graceful handling of session expiry
- Automatic cleanup of invalid sessions
- Proper error propagation to the client

### Type Safety
- Custom TypeScript definitions for session data
- Enhanced user and session interfaces
- Better IDE support and type checking

## Usage

### Basic Usage with useUserSession
```vue
<script setup>
const { loggedIn, user, fetch: refreshSession } = useUserSession()

// Check if user is logged in
if (loggedIn.value) {
  console.log('User:', user.value)
}

// Manually refresh session
await refreshSession()
</script>
```

### Using the Enhanced Auth Composable
```vue
<script setup>
const { 
  isAuthenticated, 
  sessionExpiresSoon, 
  sessionExpiresIn,
  login,
  logout,
  refreshSession 
} = useAuth()

// Login
const result = await login({ email: 'user@example.com', password: 'password' })
if (result.success) {
  // Login successful
}

// Logout
await logout()
</script>
```

### Session Monitoring
The system automatically monitors session expiry and refreshes tokens when needed. You can also monitor session status:

```vue
<template>
  <div v-if="sessionExpiresSoon" class="warning">
    Session expires in {{ Math.floor(sessionExpiresIn / 60) }} minutes
  </div>
</template>
```

## Architecture

### Server-Side Session Management
- Session data is stored in secure HTTP-only cookies
- Server-side hooks handle session validation and refresh
- Supabase token refresh is handled transparently

### Client-Side Synchronization
- Client-side plugin monitors session state
- Automatic refresh when session approaches expiry
- Reactive session state across all components

### Middleware Protection
The `authenticated` middleware now properly handles session refresh and validation:
- Checks authentication status
- Refreshes session if needed
- Redirects to login if session is invalid

## Preventing Auth Desync Issues

The refactored system addresses common auth desync issues:

1. **Token Expiry**: Automatic refresh prevents expired token issues (Supabase tokens refresh automatically)
2. **Long Sessions**: Sessions last one year, so users don't need to re-login frequently
3. **Server/Client Mismatch**: Session hooks ensure server and client stay in sync
4. **Multiple Tab Issues**: Centralized session management handles multi-tab scenarios
5. **Network Issues**: Graceful error handling and retry logic
6. **Race Conditions**: Proper async handling and state management

## Migration Notes

If migrating from the old auth system:

1. Update login calls to use `/api/auth/login`
2. Update logout calls to use `/api/auth/logout`
3. Remove manual token refresh calls - now handled automatically
4. Update TypeScript types if using custom session data
5. Test authentication flows thoroughly

## Troubleshooting

### Session Password Error
If you get a session password error, make sure `NUXT_SESSION_PASSWORD` is set and has at least 32 characters.

### Supabase Connection Issues
Verify your `SUPABASE_URL` and `SUPABASE_KEY` environment variables are correct.

### Session Not Persisting
Check that cookies are enabled and the session password is properly configured.

### Auto-refresh Not Working
Ensure the client-side plugin is loaded and the session includes `expiresAt` data. 