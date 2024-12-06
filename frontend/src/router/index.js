// router/index.js

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

  // 0. Sauvegarder le inviteToken s'il est présent, quel que soit le type de route
  if (to.query.inviteToken) {
    store.dispatch('saveInviteToken', to.query.inviteToken);
  }

  // 1. Gestion des routes publiques (sans authentification requise)
  if (to.meta.requiresAuth === false) {
    if (isAuthenticated) {
      // Si l'utilisateur est authentifié, redirige en fonction de son rôle
      const decoded = jwtDecode(token);
      const userRole = decoded.roleId;
      if (userRole === 1) {
        return next('/admin/tourneys');
      } else {
        return next('/tourneys');
      }
    }
    return next(); // Autorise l'accès à la route publique
  }

  // 2. Gestion des pages de connexion et d'inscription pour les utilisateurs déjà authentifiés
  if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
    const decoded = jwtDecode(token);
    const userRole = decoded.roleId;
    // Redirige en fonction du rôle pour éviter les pages de login/register pour les utilisateurs connectés
    if (userRole === 1) {
      return next('/admin/tourneys');
    } else {
      return next('/tourneys');
    }
  }

  // 3. Gestion de l'authentification pour les routes protégées
  if (to.meta.requiresAuth) {
    // Si l'utilisateur n'est pas authentifié
    if (!isAuthenticated) {
      store.dispatch('logout'); // Déconnecte l'utilisateur
      return next('/login'); // Redirige vers la page de connexion
    }

    // Si le token est expiré, gère l'expiration
    if (isTokenExpired()) {
      handleTokenExpiration(); // Effectue les actions nécessaires lors de l'expiration du token
      return next('/login'); // Redirige vers la page de connexion
    }

    // 4. Tentative de rafraîchissement du token et récupération des informations utilisateur
    try {
      const newToken = await refreshToken();
      localStorage.setItem('token', newToken);
      apiService.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${newToken}`;

      // Récupère les informations utilisateur et les enregistre dans le store
      const userResponse = await apiService.get('/users/me');
      const user = userResponse.data;

      const decoded = jwtDecode(newToken);
      store.commit('SET_AUTH', {
        isAuthenticated: true,
        user,
        tokenExpiration: decoded.exp,
      });

      const userRole = user.roleId;

      // 5. Vérification des permissions d'accès à la route
      if (to.meta.permission && !hasPermission(userRole, to.meta.permission)) {
        // Si l'utilisateur n'a pas la permission requise, redirige vers une page d'accès refusé
        return next('/access-denied');
      }


      // 5.5 Vérification de l'inviteToken une fois l'utilisateur authentifié
      const inviteToken = store.state.inviteToken;
      if (inviteToken) {
        try {
          await apiService.post('/tourneys/join', { token: inviteToken });
          // Une fois le tournoi rejoint, récupérer l'ID du tournoi depuis le token
          const decodedInvite = jwtDecode(inviteToken);
          const tourneyId = decodedInvite.tourneyId;
          // Nettoyer le token
          store.dispatch('clearInviteToken');
          // Rediriger directement vers la page d'association au tournoi
          return next(`/tourneys/${tourneyId}/join-team`);
        } catch (err) {
          console.error('Erreur lors de la jonction au tournoi:', err);
        }
        // Nettoyer le token même en cas d'erreur
        store.dispatch('clearInviteToken');
        // Puis continuer la navigation normale (vers /tourneys ou autre)
        return next();
      }

      // 6. Gestion des routes spécifiques aux tournois
      const isTournamentRoute =
        (to.path.startsWith('/tourneys/') ||
          to.path.startsWith('/admin/tourneys/')) &&
        to.params.tourneyId;

      if (isTournamentRoute) {
        // Récupération des statuts et informations du tournoi
        try {
          const tourneyId = to.params.tourneyId;
          await store.dispatch('tourney/fetchTourneyStatuses', tourneyId);
        } catch (error) {
          console.error('Erreur lors de la récupération du tournoi:', error);

          if (error.response && error.response.status === 404) {
            // Redirige vers une page 404 si le tournoi n'est pas trouvé
            return next({ name: 'NotFoundPage' });
          } else {
            await store.dispatch('tourney/clearTournamentName');
          }
        }
      } else {
        // Si la route n'est pas liée à un tournoi, nettoie les informations du tournoi dans le store
        store.dispatch('tourney/clearTournamentName');
      }

      // Autorise l'accès à la route après avoir vérifié toutes les conditions
      return next();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token :', error);
      store.dispatch('logout');
      return next('/login'); // Redirige vers la page de connexion en cas d'erreur
    }
  } else {
    // 7. Routes qui ne nécessitent pas d'authentification
    return next(); // Autorise la navigation pour les routes publiques
  }
});

export default router;
