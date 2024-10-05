export function requireAuth(to, from, next, store) {
  const isAuthenticated = store.state.isAuthenticated;
  const userRole = store.state.user?.roleId;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login'); // Redirige vers login si non authentifié
  } else if (to.meta.role && to.meta.role !== userRole) {
    next('/'); // Redirige vers la page d'accueil si rôle incorrect
  } else {
    next(); // Passe à la route suivante
  }
}