export default defineNuxtRouteMiddleware(async () => {
  const { loggedIn, user, fetch } = useUserSession();
  
  // redirect the user to the login screen if they're not authenticated
  if (!loggedIn.value) {
    return navigateTo("/login");
  }

  // Refresh the session to ensure it's up to date
  // This will trigger the session hooks we set up
  try {
    await fetch();
    
    // Double-check after refresh
    if (!user.value) {
      return navigateTo("/login");
    }
  } catch (error) {
    console.error("Error refreshing session in middleware:", error);
    return navigateTo("/login");
  }
});
