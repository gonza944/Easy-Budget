import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

const clearClientStores = () => {
  if (import.meta.client) {
    const { clearStore } = useClearStore();
    clearStore();
  }
};

export const useAuth = () => {
  const user = useState<User | null>("auth:user", () => null);
  const session = useState<Session | null>("auth:session", () => null);
  const initialized = useState("auth:initialized", () => false);
  const initializing = useState("auth:initializing", () => false);

  const loggedIn = computed(() => Boolean(user.value));
  const isAuthenticated = computed(() => loggedIn.value);

  const sessionExpiresIn = computed(() => {
    if (!session.value?.expires_at) {
      return null;
    }

    const remainingSeconds =
      session.value.expires_at - Math.floor(Date.now() / 1000);

    return remainingSeconds > 0 ? remainingSeconds : 0;
  });

  const sessionExpiresSoon = computed(() => {
    return sessionExpiresIn.value !== null && sessionExpiresIn.value < 300;
  });

  const applyAuthState = (nextSession: Session | null, nextUser?: User | null) => {
    session.value = nextSession;
    user.value = nextUser ?? nextSession?.user ?? null;
    initialized.value = true;
  };

  const clearAuthState = () => {
    session.value = null;
    user.value = null;
    initialized.value = true;
  };

  const redirectToLoginIfNeeded = async () => {
    if (import.meta.client && useRoute().path !== "/login") {
      await navigateTo("/login");
    }
  };

  const initialize = async (force = false) => {
    if ((initialized.value && !force) || initializing.value) {
      return;
    }

    initializing.value = true;

    try {
      if (import.meta.server) {
        const event = useRequestEvent();

        if (!event) {
          clearAuthState();
          return;
        }

        const { getSupabaseUser } = await import("~/server/utils/supabase");
        const serverUser = await getSupabaseUser(event);

        applyAuthState(null, serverUser);
        return;
      }

      const supabase = useSupabaseClient();
      const [
        {
          data: { session: currentSession },
        },
        {
          data: { user: currentUser },
          error,
        },
      ] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser(),
      ]);

      if (error || !currentUser) {
        clearAuthState();
        return;
      }

      applyAuthState(currentSession, currentUser);
    } catch (error) {
      console.error("Failed to initialize auth state:", error);
      clearAuthState();
    } finally {
      initializing.value = false;
    }
  };

  const handleAuthStateChange = async (
    event: AuthChangeEvent,
    nextSession: Session | null
  ) => {
    if (event === "SIGNED_OUT" || !nextSession) {
      clearAuthState();
      clearClientStores();
      await redirectToLoginIfNeeded();
      return;
    }

    applyAuthState(nextSession);

    if (!import.meta.client) {
      return;
    }

    const supabase = useSupabaseClient();
    const {
      data: { user: verifiedUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !verifiedUser) {
      clearAuthState();
      clearClientStores();
      await redirectToLoginIfNeeded();
      return;
    }

    applyAuthState(nextSession, verifiedUser);
  };

  const refreshSession = async () => {
    if (import.meta.server) {
      await initialize(true);
      return loggedIn.value;
    }

    try {
      const supabase = useSupabaseClient();
      const {
        data: { session: refreshedSession },
        error,
      } = await supabase.auth.refreshSession();

      if (error || !refreshedSession) {
        clearAuthState();
        clearClientStores();
        return false;
      }

      await handleAuthStateChange("TOKEN_REFRESHED", refreshedSession);
      return true;
    } catch (error) {
      console.error("Failed to refresh session:", error);
      clearAuthState();
      clearClientStores();
      return false;
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    if (import.meta.server) {
      return { success: false, error: "Login is only available in the browser" };
    }

    try {
      const supabase = useSupabaseClient();
      const {
        data: { session: nextSession, user: nextUser },
        error,
      } = await supabase.auth.signInWithPassword(credentials);

      if (error || !nextSession || !nextUser) {
        return {
          success: false,
          error: error?.message || "Login failed",
        };
      }

      await handleAuthStateChange("SIGNED_IN", nextSession);
      return { success: true, user: nextUser };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  };

  const logout = async () => {
    if (import.meta.server) {
      clearAuthState();
      return;
    }

    try {
      const supabase = useSupabaseClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Supabase logout error:", error);
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      clearAuthState();
      clearClientStores();
    }
  };

  return {
    user,
    session,
    loggedIn,
    isAuthenticated,
    initialized,
    sessionExpiresIn,
    sessionExpiresSoon,
    initialize,
    handleAuthStateChange,
    login,
    logout,
    refreshSession,
  };
};
