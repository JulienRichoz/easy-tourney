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

  // 1. Gestion des routes publiques (sans authentification requise)
  if (to.meta.requiresAuth === false) {
    if (isAuthenticated) {
      // Si l'utilisateur est authentifié, redirige en fonction de son rôle
      const decoded = jwtDecode(token);
      const userRole = decoded.roleId;
      if (userRole === 1) {
        return next('/admin/tourneys');
      } else {
        return next('/user');
      }
    }
    if (to.query.inviteToken) {
      // Si un token d'invitation est présent, le sauvegarde
      store.dispatch('saveInviteToken', to.query.inviteToken);
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
      return next('/user');
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
      const isLoginNavigation =
        from.name === 'Login' || from.name === 'Register';

      // 5. Vérification des permissions d'accès à la route
      if (to.meta.permission && !hasPermission(userRole, to.meta.permission)) {
        // Si l'utilisateur n'a pas la permission requise, redirige vers une page d'accès refusé
        return next('/access-denied');
      }

      // Récupérer le tournoi actif
      await store.dispatch('userTourney/fetchActiveTourney');

      const activeTourney = store.state.userTourney.activeTourney;
      console.log('activeTourney', activeTourney);

      if (activeTourney && activeTourney.status === 'active') {
        // Récupérer le rôle dans le tournoi
        await store.dispatch('userTourney/fetchTourneyRole', activeTourney.id);

        // Redirection en fonction du tournoi actif
        if (to.name === 'UserTourneys') {
          if (isLoginNavigation) {
            return next(`/tourneys/${activeTourney.id}/planning`);
          }
        }
      } else {
        if (to.name === 'UserTourneys') {
          // Autoriser l'accès sans redirection
          return next();
        }
      }

      // 6. Gestion des routes spécifiques aux tournois
      const isTournamentRoute =
        (to.path.startsWith('/tourneys/') ||
          to.path.startsWith('/admin/tourneys/')) &&
        to.params.tourneyId;

      if (isTournamentRoute) {
        try {
          const tourneyId = to.params.tourneyId;
          // Récupérer les détails du tournoi, y compris le statut
          const response = await apiService.get(`/tourneys/${tourneyId}`);
          const tourney = response.data;

          // Vérifier si le statut est 'active' ou 'completed'
          if (
            tourney.status === 'active' ||
            tourney.status === 'completed' ||
            userRole === 1
          ) {
            // Autoriser l'accès
            await store.dispatch('tourney/fetchTourneyStatuses', tourneyId);
          } else {
            // Rediriger ou afficher une page d'accès refusé
            return next('/access-denied'); // TODO: Ajouter dans la vue un message pour empecher l'accès
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du tournoi:', error);

          if (error.response && error.response.status === 404) {
            // Redirige vers une page 404 si le tournoi n'est pas trouvé
            return next({ name: 'NotFoundPage' });
          } else {
            await store.dispatch('tourney/clearTournamentName');
          }
        }
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
