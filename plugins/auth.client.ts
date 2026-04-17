let authSubscription: { unsubscribe: () => void } | null = null;

export default defineNuxtPlugin(async (nuxtApp) => {
  const auth = useAuth();
  await auth.initialize();

  const supabase = useSupabaseClient();

  if (!authSubscription) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      await auth.handleAuthStateChange(event, session);
    });

    authSubscription = subscription;
  }

  nuxtApp.hook("app:beforeUnmount", () => {
    authSubscription?.unsubscribe();
    authSubscription = null;
  });
});
