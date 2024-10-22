import { createRouter, createWebHistory } from 'vue-router';
import store from '../store'; // Vuex pour gérer les rôles
import { refreshToken, hasPermission, isTokenExpired, handleTokenExpiration } from '@/services/authService';
import apiService from '@/services/apiService';
import jwtDecode from 'jwt-decode';

import AdminPage from '../views/admin/AdminPage.vue';
import UserPage from '../views/user/UserPage.vue';
import LoginPage from '../views/auth/LoginPage.vue';
import RegisterPage from '../views/auth/RegisterPage.vue';
import NotFoundPage from '../views/NotFound.vue';
import AccessDenied from '../views/AccessDenied.vue';
import SportsPage from '../views/admin/SportsPage.vue'; // Gestion des sports d'un tournoi
import TourneysPage from '../views/admin/TourneysPage.vue'; // Liste des tournois
import TourneyDetails from '../views/admin/TourneyDetails.vue'; // Détails d'un tournoi
import TourneyFields from '../views/admin/TourneyFields.vue'; // Gestion des terrains d'un tournoi
import TourneySportsFields from '../views/admin/TourneySportsFields.vue'; // Gestion des sports sur les terrains

const routes = [
  /*
      ROUTE D'ERREUR
  */
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFoundPage',
    component: NotFoundPage,
  },

  {
    path: '/access-denied',
    name: 'AccessDenied',
    component: AccessDenied,
  },

  /*
      ROUTES D'AUTHENTIFICATION
  */
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

  /*
      ROUTES USER ET ADMIN
  */
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
    path: '/tourneys',
    name: 'Tourneys',
    component: TourneysPage,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },

  /*
      ROUTES LIEES A UN TOURNOI
  */
  {
    path: '/tourneys/:id',
    name: 'TourneyDetails',
    component: TourneyDetails,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/sports',
    name: 'SportsPage',
    component: SportsPage,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/tourneys/:id/fields',
    name: 'TourneyFields',
    component: TourneyFields,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/tourneys/:id/sports-fields',
    name: 'TourneySportsFields',
    component: TourneySportsFields,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },


];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  if (to.meta.requiresAuth === false) {
    if (isAuthenticated) {
      const decoded = jwtDecode(token);
      const userRole = decoded.roleId;

      if (userRole === 'admin') {
        return next('/tourneys');
      } else {
        return next('/user');
      }
    }
    return next();
  }

  if (isAuthenticated && isTokenExpired()) {
    handleTokenExpiration();
    return next('/login');
  }

  if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
    const decoded = jwtDecode(token);
    const userRole = decoded.roleId;

    if (userRole === 'admin') {
      return next('/tourneys');
    } else {
      return next('/user');
    }
  }

  const isTournamentRoute = to.path.startsWith('/tourneys/') && to.params.id;
  if (isTournamentRoute) {
    try {
      const response = await apiService.get(`/tourneys/${to.params.id}`);
      const tournamentName = response.data.name;

      store.dispatch('setTournamentName', tournamentName);
    } catch (error) {
      console.error('Erreur lors de la récupération du tournoi:', error);
      store.dispatch('clearTournamentName');
    }
  } else {
    store.dispatch('clearTournamentName');
  }

  if (to.meta.requiresAuth) {
    if (!token) {
      store.dispatch('logout');
      return next('/login');
    } else {
      try {
        const newToken = await refreshToken();
        localStorage.setItem('token', newToken);

        const decoded = jwtDecode(newToken);
        store.commit('SET_AUTH', {
          isAuthenticated: true,
          user: decoded,
        });

        const userRole = decoded.roleId;

        if (to.meta.permission && !hasPermission(userRole, to.meta.permission)) {
          return next('/access-denied');
        }

        return next();
      } catch (error) {
        console.error('Erreur lors du rafraîchissement du token :', error);
        store.dispatch('logout');
        return next('/login');
      }
    }
  } else {
    next();
  }
});

export default router;
