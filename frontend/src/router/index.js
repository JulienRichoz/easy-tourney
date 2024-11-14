// router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import store from '../store';
import { refreshToken, hasPermission, isTokenExpired, handleTokenExpiration } from '@/services/authService';
import { jwtDecode } from 'jwt-decode';
import apiService from '@/services/apiService';

// Importation des fichiers de routes
import authRoutes from './authRoutes';
import adminRoutes from './adminRoutes';
import userRoutes from './userRoutes';

// Définition des routes de l'application
const routes = [
  ...authRoutes,
  ...adminRoutes,
  ...userRoutes,
];

// Configuration du routeur Vue
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Gestion des événements avant chaque navigation
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token'); // Récupération du token JWT
  const isAuthenticated = !!token; // Vérifie si l'utilisateur est authentifié

  // Gestion des routes publiques (ne nécessitant pas d'authentification)
  if (to.meta.requiresAuth === false) {
    if (isAuthenticated) {
      const decoded = jwtDecode(token);
      const userRole = decoded.roleId;
      // Rediriger en fonction du rôle de l'utilisateur
      if (userRole === 1) {
        return next('/admin/tourneys');
      } else {
        return next('/user');
      }
    }
    if (to.query.inviteToken) {
      store.dispatch('saveInviteToken', to.query.inviteToken); // Sauvegarde le token d’invitation
    }
    return next(); // Poursuivre si l'utilisateur n'est pas authentifié
  }

  // Si l'utilisateur est déjà connecté et tente d'accéder aux pages login ou register
  if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
    const decoded = jwtDecode(token);
    const userRole = decoded.roleId;
    if (userRole === 1) {
      return next('/admin/tourneys');
    } else {
      return next('/user');
    }
  }

  // Gestion de l'authentification pour les routes protégées
  if (to.meta.requiresAuth) {
    // Vérifier si l'utilisateur est authentifié
    if (!isAuthenticated) {
      store.dispatch('logout'); // Déconnecter si pas de token
      return next('/login'); // Rediriger vers la page de connexion
    }

    // Vérifier si le token est expiré
    if (isTokenExpired()) {
      handleTokenExpiration(); // Gérer l'expiration du token
      return next('/login'); // Rediriger vers la page de connexion
    }

    try {
      // Rafraîchir le token
      const newToken = await refreshToken();
      localStorage.setItem('token', newToken);
      apiService.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      // Récupérer les informations de l'utilisateur
      const userResponse = await apiService.get('/users/me');
      const user = userResponse.data;

      const decoded = jwtDecode(newToken);
      store.commit('SET_AUTH', {
        isAuthenticated: true,
        user,
        tokenExpiration: decoded.exp,
      });

      const userRole = user.roleId;

      // Vérification des permissions pour l'accès à la route
      if (to.meta.permission && !hasPermission(userRole, to.meta.permission)) {
        return next('/access-denied'); // Rediriger vers la page d'accès refusé
      }

      // Vérification si la route concerne un tournoi
      const isTournamentRoute = (
        (to.path.startsWith('/tourneys/') || to.path.startsWith('/admin/tourneys/'))
        && to.params.tourneyId
      );

      if (isTournamentRoute) {
        try {
          const tourneyId = to.params.tourneyId;
          // Récupérer les statuts, le nom et le tourneyType via fetchTourneyStatuses
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

      return next(); // Autoriser l'accès si tout est correct
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token :', error);
      store.dispatch('logout');
      return next('/login'); // Rediriger vers la page de connexion en cas d'erreur
    }
  } else {
    // Si la route ne nécessite pas d'authentification, continuer
    return next();
  }
});

export default router;
