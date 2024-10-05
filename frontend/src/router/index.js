import { createRouter, createWebHistory } from 'vue-router';
import store from '../store'; // Si vous utilisez Vuex pour gérer les rôles
import { refreshToken, hasPermission } from '@/services/authService'; // Importez les fonctions nécessaires
import { jwtDecode } from 'jwt-decode'; // Importez jwt-decode pour décoder le token

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
    component: NotFoundPage, // Crée une vue NotFound.vue
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
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Ajoutez le beforeEach global ici
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token');

  if (to.meta.requiresAuth) {
    if (!token) {
      console.log('Token non trouvé, redirection vers /login');
      store.commit('LOGOUT');
      return next('/login'); // Rediriger vers la page de login si non authentifié
    } else {
      try {
        // Rafraîchir le token si nécessaire
        const newToken = await refreshToken();
        localStorage.setItem('token', newToken);

        // Décodez le nouveau token pour vérifier le rôle de l'utilisateur
        const decoded = jwtDecode(newToken);
        console.log('router.beforeEach -> Token décodé:', decoded);

        store.commit('SET_AUTH', {
          isAuthenticated: true,
          user: decoded,
        });

        // Vérifiez si l'utilisateur a la permission d'accéder à la page demandée
        const userRole = decoded.roleId;
        console.log('router.beforeEach -> Vérification des permissions pour userRole:', userRole, 'permission:', to.meta.permission);

        if (to.meta.permission && !hasPermission(userRole, to.meta.permission)) {
          console.log('Utilisateur sans les permissions nécessaires, redirection vers /');
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
    console.log('Route publique, accès autorisé.');
    next(); // Pour les routes publiques
  }
});



export default router;
