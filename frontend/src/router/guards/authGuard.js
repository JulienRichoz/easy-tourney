// router/guards/authGuard.js

import { permissions } from '../../services/permissions';

/**
 * Vérifie si l'utilisateur est connecté et s'il a les permissions nécessaires pour accéder à une route protégée.
 * @param {*} to - Route vers laquelle l'utilisateur souhaite accéder.
 * @param {*} from - Route depuis laquelle l'utilisateur souhaite accéder.
 * @param {*} next - Fonction qui permet de passer à la route suivante.
 * @param {*} store - Store de l'application.
 * @returns redirection vers la page de connexion si l'utilisateur n'est pas connecté ou n'a pas les permissions nécessaires.
 */
export function requireAuth(to, from, next, store) {
  const isAuthenticated = store.state.isAuthenticated;
  const userRole = store.state.user?.roleId;

  // Vérifie si la route nécessite une authentification
  if (to.meta.requiresAuth && !isAuthenticated) {
    store.commit(
      'SET_ALERT_MESSAGE',
      'Vous devez être connecté pour accéder à cette page.'
    );
    return next('/login');
  }

  // Vérifie si la route nécessite une permission particulière
  if (to.meta.permission) {
    if (
      !permissions[userRole] ||
      !permissions[userRole].includes(to.meta.permission)
    ) {
      return next('/');
    }
  }

  next();
}
