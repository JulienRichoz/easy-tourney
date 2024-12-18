import { createRouter, createWebHistory } from 'vue-router';
import store from '../store';
import {
  refreshToken,
  hasPermission,
  isTokenExpired,
  handleTokenExpiration,
} from '@/services/authService';
import { jwtDecode } from 'jwt-decode';
import apiService from '@/services/apiService';

// Importation des fichiers de routes
import authRoutes from './authRoutes';
import adminRoutes from './adminRoutes';
import userRoutes from './userRoutes';

// Définition des routes de l'application
const routes = [...authRoutes, ...adminRoutes, ...userRoutes];

// Configuration du routeur Vue
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Gestion des événements avant chaque navigation
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token'); // Récupération du token JWT
  const isAuthenticated = !!token; // Vérifie si l'utilisateur est authentifié

  // Vérifier si l'application est hors ligne
  const isOffline = !navigator.onLine;

  // Sauvegarder le inviteToken s'il est présent
  if (to.query.inviteToken) {
    store.dispatch('saveInviteToken', to.query.inviteToken);
  }

  // Gestion des routes publiques (sans authentification requise)
  if (to.meta.requiresAuth === false) {
    if (isAuthenticated) {
      const decoded = jwtDecode(token);
      const userRole = decoded.roleId;
      if (userRole === 1) {
        return next('/admin/tourneys');
      } else {
        return next('/tourneys');
      }
    }
    return next();
  }

  // Gestion des pages de connexion et d'inscription
  if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
    const decoded = jwtDecode(token);
    const userRole = decoded.roleId;
    if (userRole === 1) {
      return next('/admin/tourneys');
    } else {
      return next('/tourneys');
    }
  }

  // Gestion des routes protégées
  if (to.meta.requiresAuth) {
    // Si l'utilisateur n'est pas authentifié
    if (!isAuthenticated) {
      store.dispatch('logout');
      return next('/login');
    }

    // Si le token est expiré
    if (isTokenExpired()) {
      handleTokenExpiration();
      return next('/login');
    }

    // Gestion des pages accessibles hors ligne (/tourneys uniquement)
    if (isOffline) {
      if (to.path.startsWith('/tourneys')) {
        console.warn('Mode hors ligne : accès autorisé pour /tourneys.');
        return next();
      } else if (to.path.startsWith('/admin') && isAuthenticated) {
        console.warn('Mode hors ligne : accès admin possible avec données en cache.');
        // Laisser passer sans redirection vers login
        return next();
      } else {
        console.warn('Mode hors ligne : non admin ou non authentifié, redirection login.');
        return next('/login');
      }
    }

    // Rafraîchissement du token et gestion des permissions
    try {
      const newToken = await refreshToken();
      localStorage.setItem('token', newToken);
      apiService.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      // Récupérer l'utilisateur
      const userResponse = await apiService.get('/users/me');
      const user = userResponse.data;
      const decoded = jwtDecode(newToken);

      store.commit('SET_AUTH', {
        isAuthenticated: true,
        user,
        tokenExpiration: decoded.exp,
      });

      const userRole = user.roleId;

      // Vérification des permissions d'accès à la route
      if (to.meta.permission && !hasPermission(userRole, to.meta.permission)) {
        return next('/access-denied');
      }

      // Gestion des tokens d'invitation
      const inviteToken = store.state.inviteToken;
      if (inviteToken) {
        try {
          await apiService.post('/tourneys/join', { token: inviteToken });
          const decodedInvite = jwtDecode(inviteToken);
          const tourneyId = decodedInvite.tourneyId;
          store.dispatch('clearInviteToken');
          return next(`/tourneys/${tourneyId}/join-team`);
        } catch (err) {
          console.error('Erreur lors de la jonction au tournoi:', err);
        }
        store.dispatch('clearInviteToken');
        return next();
      }

      // Récupération des données spécifiques aux tournois
      const isTournamentRoute =
        (to.path.startsWith('/tourneys/') ||
          to.path.startsWith('/admin/tourneys/')) &&
        to.params.tourneyId;

      if (isTournamentRoute) {
        try {
          const tourneyId = to.params.tourneyId;
          await store.dispatch('tourney/fetchTourneyStatuses', tourneyId);
        } catch (error) {
          console.error('Erreur lors de la récupération du tournoi:', error);
          if (error.response && error.response.status === 404) {
            return next({ name: 'NotFoundPage' });
          } else {
            await store.dispatch('tourney/clearTournamentName');
          }
        }
      } else {
        store.dispatch('tourney/clearTournamentName');
      }

      return next();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      store.dispatch('logout');
      return next('/login');
    }
  }

  return next();
});

export default router;
