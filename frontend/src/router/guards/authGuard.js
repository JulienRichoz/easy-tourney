import { permissions, roles } from '../../services/permissions';

export function requireAuth(to, from, next, store) {
  const isAuthenticated = store.state.isAuthenticated;
  const userRole = store.state.user?.roleId;

  // Vérifie si la route nécessite une authentification
  if (to.meta.requiresAuth && !isAuthenticated) {
    store.commit('SET_ALERT_MESSAGE', 'Vous devez être connecté pour accéder à cette page.');
    return next('/login');
  }

  // Vérifie si la route nécessite une permission particulière
  if (to.meta.permission) {
    const roleKey = Object.keys(roles).find(key => roles[key] === userRole);
    if (!permissions[roleKey] || !permissions[roleKey].includes(to.meta.permission)) {
      return next('/');
    }
  }

  next();
}