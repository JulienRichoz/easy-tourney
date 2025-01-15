// router/authRoutes.js
// Description: Ce fichier contient les routes pour les pages d'authentification.
import LoginPage from '@/views/auth/LoginPage.vue';
import RegisterPage from '@/views/auth/RegisterPage.vue';
import AccessDenied from '@/views/shared/AccessDenied.vue';
import NotFoundPage from '@/views/shared/NotFound.vue';
import ForgotPassword from '@/views/auth/ForgotPassword.vue';
import ResetPassword from '@/views/auth/ResetPassword.vue';


export default [
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
  {
    path: '/access-denied',
    name: 'AccessDenied',
    component: AccessDenied,
  },
  {
    path: '/404',
    name: 'NotFoundPage',
    component: NotFoundPage,
  },
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'LoginPage',
    component: LoginPage,
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'RegisterPage',
    component: RegisterPage,
    meta: { requiresAuth: false },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: { requiresAuth: false },
  },

  {
    path: '/reset-password/:token',
    name: 'ResetPassword',
    component: ResetPassword,
    meta: { requiresAuth: false },
  },
];
