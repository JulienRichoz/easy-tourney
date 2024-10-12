// frontend/src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import store from '../store'; // Si vous utilisez Vuex pour gérer les rôles
import { refreshToken, hasPermission } from '@/services/authService';
import { jwtDecode } from 'jwt-decode';

import AdminPage from '../views/admin/AdminPage.vue';
import UserPage from '../views/user/UserPage.vue';
import LoginPage from '../views/auth/LoginPage.vue';
import RegisterPage from '../views/auth/RegisterPage.vue';
import HomePage from '../views/HomePage.vue';
import NotFoundPage from '../views/NotFound.vue';
import TourneysPage from '../views/admin/AdminTourneys.vue'; // Nouvelle vue pour les tournois
import TourneyDetails from '../views/admin/TourneyDetails.vue'; // Nouvelle vue pour les détails du tournoi
import AdminSports from '../views/admin/AdminSports.vue'; // Nouvelle vue pour les sports

const routes = [
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundPage,
  },
  { path: '/', name: 'Home', component: HomePage },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },
  { path: '/register', name: 'Register', component: RegisterPage },
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
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Gestion des gardiens d'authentification pour les rôles
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token');

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
        console.log('router.beforeEach -> Vérification des permissions pour userRole:', userRole, 'permission:', to.meta.permission);

        if (to.meta.permission && !hasPermission(userRole, to.meta.permission)) {
          return next('/'); // Rediriger à la page d'accueil si l'utilisateur n'a pas les permissions
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
