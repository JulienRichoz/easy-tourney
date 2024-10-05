import { createRouter, createWebHistory } from 'vue-router';
import store from '../store'; // Si tu utilises Vuex pour gérer les rôles
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
    meta: { requiresAuth: true, role: 1 }
  },
  {
    path: '/user',
    name: 'User',
    component: UserPage,
    meta: { requiresAuth: true }
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = store.state.isAuthenticated; // Vérifie si l'utilisateur est authentifié
  const userRole = store.state.user?.roleId; // Récupère le rôle de l'utilisateur

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login'); // Redirige vers login si l'utilisateur n'est pas authentifié
  } else if (to.meta.role && to.meta.role !== userRole) {
    next('/'); // Redirige vers la page d'accueil si l'utilisateur n'a pas le bon rôle
  } else {
    next(); // Passe à la route suivante
  }
});

export default router;
