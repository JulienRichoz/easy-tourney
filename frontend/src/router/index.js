import { createRouter, createWebHistory } from 'vue-router';
import store from '../store'; // Si tu utilises Vuex pour gérer les rôles
import { requireAuth } from './guards/authGuard';
import { refreshToken } from '../services/authService';
import authService from '@/services/authService';

import AdminPage from '../views/admin/AdminPage.vue';
import UserPage from '../views/user/UserPage.vue';
import LoginPage from '../views/auth/LoginPage.vue';
import RegisterPage from '../views/auth/RegisterPage.vue';
import HomePage from '../views/HomePage.vue';
import NotFoundPage from '../views/NotFound.vue';

const routes = [
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundPage // Crée une vue NotFound.vue
  },
  { path: '/', name: 'Home', component: HomePage },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    beforeEnter: (to, from, next) => {
      // Si l'utilisateur est authentifié, redirige vers la page appropriée
      if (authService.isAuthenticated()) {
        if (authService.isAdmin()) {
          next({ path: '/admin', replace: true }); // Le replace true signifie que la redirection va remplacer l'entrée courante dans l'historique au lieu de l'ajouter. Cela a pour effet de ne pas laisser de trace de la page
        } else {
          next({ path: '/user', replace: true });
        }
      } else {
        next();
      }
    },
  },
  { path: '/register', name: 'Register', component: RegisterPage },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminPage,
    meta: { requiresAuth: true, permission: 'viewAdminPage' }
  },
  {
    path: '/user',
    name: 'User',
    component: UserPage,
    meta: { requiresAuth: true, permission: 'viewUserPage' }
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token');

  // Si le token n'est pas présent et que la route nécessite une authentification
  if (to.meta.requiresAuth && !token) {
    store.commit('LOGOUT');
    next('/login'); // Rediriger vers la page de login
  } else if (token) {
    // Si le token est présent, essayez de le rafraîchir
    try {
      await refreshToken();
      requireAuth(to, from, next, store);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token :', error);
      store.commit('LOGOUT');
      next('/login');
    }
  } else {
    // Pour les routes qui ne nécessitent pas d'authentification
    requireAuth(to, from, next, store);
  }
});

export default router;