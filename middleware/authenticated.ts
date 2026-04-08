export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuth();

  try {
    await auth.initialize();

    if (!auth.loggedIn.value) {
      return navigateTo("/login");
    }
  } catch (error) {
    console.error("Error resolving auth state in middleware:", error);
    return navigateTo("/login");
  }
});
