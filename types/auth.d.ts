declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    name: string
  }

  interface UserSession {
    loggedInAt: number
    expiresAt?: number
    accessToken?: string
  }

  interface SecureSessionData {
    // Add any secure fields that should only be accessible server-side
    supabaseRefreshToken?: string
  }
}

// Export SessionUser type for server-side use
export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export {} 