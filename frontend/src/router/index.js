// Import des modules nécessaires pour la gestion des routes
import { createRouter, createWebHistory } from 'vue-router';
import store from '../store'; // Vuex pour gérer les rôles
import { refreshToken, hasPermission, isTokenExpired, handleTokenExpiration } from '@/services/authService';
import apiService from '@/services/apiService';
import { jwtDecode } from 'jwt-decode'; // Corrigé l'import pour jwtDecode

// Importation des composants de vues
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

// Définition des routes de l'application
const routes = [
  /*
    ROUTE D'ERREUR (Page 404)
    Cette route capte toutes les routes non définies et redirige vers la page NotFound.
  */
  {
    path: '/404',
    name: 'NotFoundPage',
    component: NotFoundPage,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },

  /*
    ROUTE D'ACCÈS REFUSÉ
    Utilisée lorsque l'utilisateur n'a pas les permissions requises.
  */
  {
    path: '/access-denied',
    name: 'AccessDenied',
    component: AccessDenied,
  },

  /*
    ROUTES D'AUTHENTIFICATION (Login, Register)
    Redirection par défaut vers la page de login.
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
    meta: { requiresAuth: false },
  },

  /*
    ROUTES PROTÉGÉES (User et Admin)
    Ces routes nécessitent une authentification et des permissions spécifiques.
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
  {
    path: '/sports',
    name: 'SportsPage',
    component: SportsPage,
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },

  /*
    ROUTES LIÉES À UN TOURNOI
    Gestion des détails d'un tournoi, des terrains, et des sports sur les terrains.
  */
  {
    path: '/tourneys/:id',
    name: 'TourneyDetails',
    component: TourneyDetails,
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
  {
    path: '/tourneys/:id/teams',
    name: 'TourneyTeams',
    component: () => import('@/views/admin/TourneyTeams.vue'), //
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
  {
    path: '/tourneys/:id/teams/:teamId',
    name: 'TeamDetails',
    component: () => import('@/views/admin/TourneyTeamDetails.vue'), //  Lazy loading du composant, Composant pour la page de gestion d'une équipe individuelle
    meta: { requiresAuth: true, permission: 'viewAdminPage' },
  },
];

// Configuration du routeur Vue
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Gestion des événements avant chaque navigation
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token'); // Récupération du token JWT
  const isAuthenticated = !!token; // Vérifie si l'utilisateur est authentifié

  // Si la route ne nécessite pas d'authentification
  if (to.meta.requiresAuth === false) {
    if (isAuthenticated) {
      const decoded = jwtDecode(token);
      const userRole = decoded.roleId;

      // Rediriger en fonction du rôle de l'utilisateur
      if (userRole === 'admin') {
        return next('/tourneys');
      } else {
        return next('/user');
      }
    }
    return next(); // Poursuivre si l'utilisateur n'est pas authentifié
  }

  // Si le token est présent mais expiré
  if (isAuthenticated && isTokenExpired()) {
    handleTokenExpiration(); // Gérer l'expiration du token
    return next('/login'); // Rediriger vers la page de connexion
  }

  // Si l'utilisateur est déjà connecté et tente d'accéder aux pages login ou register
  if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
    const decoded = jwtDecode(token);
    const userRole = decoded.roleId;

    if (userRole === 'admin') {
      return next('/tourneys');
    } else {
      return next('/user');
    }
  }

  // Vérification si la route concerne un tournoi
  const isTournamentRoute = to.path.startsWith('/tourneys/') && to.params.id;
  if (isTournamentRoute) {
    try {
      const tourneyId = to.params.id;

      // Récupérer les statuts via fetchTourneyStatuses
      await store.dispatch('tourney/fetchTourneyStatuses', tourneyId);

      // Stocker le nom du tournoi dans le store
      const response = await apiService.get(`tourneys/${tourneyId}/statuses`);
      const tournamentName = response.data.name;
      await store.dispatch('tourney/setTournamentName', tournamentName);

    } catch (error) {
      console.error('Erreur lors de la récupération du tournoi:', error);

      if (error.response && error.response.status === 404) {
        return next({ name: 'NotFoundPage' }); // Rediriger vers la page 404 si le tournoi n'existe pas
      } else {
        await store.dispatch('tourney/clearTournamentName'); // Nettoyer les données du tournoi si erreur autre que 404
      }
    }
  } else {
    store.dispatch('tourney/clearTournamentName'); // Nettoyer le nom du tournoi si on quitte une route liée à un tournoi
  }

  // Vérification si la route nécessite une authentification
  if (to.meta.requiresAuth) {
    if (!token) {
      store.dispatch('logout'); // Déconnecter si pas de token
      return next('/login'); // Rediriger vers la page de connexion
    } else {
      try {
        const newToken = await refreshToken(); // Rafraîchir le token
        localStorage.setItem('token', newToken); // Mettre à jour le token dans le localStorage

        const decoded = jwtDecode(newToken);
        store.commit('SET_AUTH', {
          isAuthenticated: true,
          user: decoded,
        });

        const userRole = decoded.roleId;

        // Vérification des permissions pour l'accès à la route
        if (to.meta.permission && !hasPermission(userRole, to.meta.permission)) {
          return next('/access-denied'); // Rediriger vers la page d'accès refusé si l'utilisateur n'a pas les droits
        }

        return next(); // Autoriser l'accès si tout est correct
      } catch (error) {
        console.error('Erreur lors du rafraîchissement du token :', error);
        store.dispatch('logout');
        return next('/login'); // Rediriger vers la page de connexion en cas d'erreur de rafraîchissement
      }
    }
  } else {
    next(); // Si la route ne nécessite pas d'authentification, continuer
  }
});

export default router;
