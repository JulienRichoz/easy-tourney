// router/authRoutes.js
import LoginPage from '@/views/auth/LoginPage.vue';
import RegisterPage from '@/views/auth/RegisterPage.vue';
import AccessDenied from '@/views/shared/AccessDenied.vue';
import NotFoundPage from '@/views/shared/NotFound.vue';

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
        name: 'Login',
        component: LoginPage,
        meta: { requiresAuth: false },
    },
    {
        path: '/register',
        name: 'Register',
        component: RegisterPage,
        meta: { requiresAuth: false },
    },
];
