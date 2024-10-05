import { createRouter, createWebHistory } from 'vue-router';
import store from '../store'; // Si tu utilises Vuex pour gérer les rôles
import { requireAuth } from './guards/authGuard';
import authService from '../services/authService'; // Import du service de permissions

import AdminPage from '../views/admin/AdminPage.vue';
import UserPage from '../views/user/UserPage.vue';
import LoginPage from '../views/auth/LoginPage.vue';
import RegisterPage from '../views/auth/RegisterPage.vue';
import HomePage from '../views/HomePage.vue';

const routes = [
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')  // Crée une vue NotFound.vue
  },
  { path: '/', name: 'Home', component: HomePage },
  { path: '/login', name: 'Login', component: LoginPage },
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

router.beforeEach((to, from, next) => {
  const isAuthenticated = store.state.isAuthenticated;
  const userRole = store.state.user?.roleId;

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next('/login');
  }

  if (to.meta.permission) {
    const hasPermission = authService.hasPermission(userRole, to.meta.permission);
    if (!hasPermission) {
      return next('/');
    }
  }

  requireAuth(to, from, next, store);
});

export default router;