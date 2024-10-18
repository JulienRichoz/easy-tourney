// frontend/src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import store from '../store'; // Si vous utilisez Vuex pour gérer les rôles
import { refreshToken, hasPermission, isTokenExpired, handleTokenExpiration } from '@/services/authService';
import { jwtDecode } from 'jwt-decode';
import apiService from '@/services/apiService';

import AdminPage from '../views/admin/AdminPage.vue';
import UserPage from '../views/user/UserPage.vue';
import LoginPage from '../views/auth/LoginPage.vue';
import RegisterPage from '../views/auth/RegisterPage.vue';
import NotFoundPage from '../views/NotFound.vue';
import AccessDenied from '../views/AccessDenied.vue'; // Import de la nouvelle vue
import TourneysPage from '../views/admin/AdminTourneys.vue'; // Nouvelle vue pour les tournois
import TourneyDetails from '../views/admin/TourneyDetails.vue'; // Nouvelle vue pour les détails du tournoi
import AdminSports from '../views/admin/AdminSports.vue'; // Nouvelle vue pour les sports
import SportsFields from '../views/admin/SportsFields.vue'; // Nouvelle vue pour la gestion d'assignement de sport à un terrain
import AdminFields from '../views/admin/AdminFields.vue'; // Nouvelle vue pour les terrains


const routes = [
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFounPage',
    component: NotFoundPage,
  },
  {
    path: '/access-denied',
    name: 'AccessDenied',
    component: AccessDenied,
  },
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage,
    meta: { requiresAuth: false }
  },
  {
    path: '/tourneys',
    name: 'Tourneys',
    component: TourneysPage,
    meta: { requiresAuth: true, permission: 'viewAdminPage', },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminPage,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/user',
    name: 'User',
    component: UserPage,
    meta: { requiresAuth: true, permission: 'viewUserPage' },
  },

  {
    path: '/tourneys/:id',
    name: 'TourneyDetails',
    component: TourneyDetails,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/admin/sports',
    name: 'AdminSports',
    component: AdminSports,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/tourneys/:id/sports-fields',
    name: 'SportsFields',
    component: SportsFields,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/tourneys/:id/fields',
    name: 'AdminFields',
    component: AdminFields,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },

];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Gestion des gardiens d'authentification pour les rôles
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token'); // Récupérer le token de l'utilisateur
  const isAuthenticated = !!token; // Vérifie si l'utilisateur est authentifié

  // Vérifie d'abord si la route ne nécessite pas d'authentification (comme login ou register)
  if (to.meta.requiresAuth === false) {
    // Si l'utilisateur est déjà authentifié et essaie d'accéder à Login ou Register, on le redirige
    if (isAuthenticated) {
      const decoded = jwtDecode(token); // Décode le token pour récupérer les infos de l'utilisateur
      const userRole = decoded.roleId;

      // Rediriger en fonction du rôle
      if (userRole === 'admin') {
        return next('/tourneys');
      } else {
        return next('/user');
      }
    }
    return next(); // Si l'utilisateur n'est pas authentifié, il peut accéder à Login ou Register
  }

  if (isAuthenticated && isTokenExpired()) {
    // Si le token est expiré, déconnecter l'utilisateur
    handleTokenExpiration();
    return next('/login'); // Rediriger vers la page de login
  }

  // Si l'utilisateur est authentifié, empêcher l'accès à la page de login et de register
  if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
    // Rediriger vers une page spécifique selon son rôle
    const decoded = jwtDecode(token); // Décode le token pour récupérer les infos de l'utilisateur
    const userRole = decoded.roleId;

    if (userRole === 'admin') {
      return next('/tourneys'); // Rediriger vers la page admin
    } else {
      return next('/user'); // Rediriger vers la page utilisateur standard
    }
  }

  // Enregistrer la vue du tournoi dans Vuex/store pour l'afficher dans le header
  const isTournamentRoute = to.path.startsWith('/tourneys/') && to.params.id; // Vérifiez si la route est pour un tournoi spécifique
  if (isTournamentRoute) {
    try {
      // Récupérer les infos du tournoi depuis l'API
      const response = await apiService.get(`/tourneys/${to.params.id}`);
      const tournamentName = response.data.name;

      // Stocker le nom du tournoi dans Vuex
      store.dispatch('setTournamentName', tournamentName);
    } catch (error) {
      console.error('Erreur lors de la récupération du tournoi:', error);
      store.dispatch('clearTournamentName'); // Effacer le nom si une erreur survient
    }
  } else {
    // Si ce n'est pas une route de tournoi, on vide le nom
    store.dispatch('clearTournamentName');
  }

  // Vérifier si la route nécessite une authentification
  if (to.meta.requiresAuth) {
    if (!token) {
      store.commit('LOGOUT');
      return next('/login'); // Rediriger vers la page de login si non authentifié
    } else {
      try {
        // Rafraîchir le token si nécessaire
        const newToken = await refreshToken();
        localStorage.setItem('token', newToken);

        // Décodez le nouveau token pour vérifier le rôle de l'utilisateur
        const decoded = jwtDecode(newToken);
        store.commit('SET_AUTH', {
          isAuthenticated: true,
          user: decoded,
        });

        // Vérifiez si l'utilisateur a la permission d'accéder à la page demandée
        const userRole = decoded.roleId;
        //console.log('router.beforeEach -> Vérification des permissions pour userRole:', userRole, 'permission:', to.meta.permission);

        if (to.meta.permission && !hasPermission(userRole, to.meta.permission)) {
          return next('/access-denied'); // Rediriger à la page d'access denied si l'utilisateur n'a pas les permissions
        }

        return next(); // Continuer vers la route demandée
      } catch (error) {
        console.error('Erreur lors du rafraîchissement du token :', error);
        store.commit('LOGOUT');
        return next('/login');
      }
    }
  } else {
    next(); // Pour les routes publiques
  }
});

export default router;
