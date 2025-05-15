export default defineNuxtRouteMiddleware(async () => {
  const { loggedIn } = useUserSession();
  // redirect the user to the login screen if they're not authenticated
  if (!loggedIn.value) {
    return navigateTo("/login");
  }

  const { error } = await useFetch("/api/refreshUser");

  if (error.value) {
    return navigateTo("/login");
  }
});
