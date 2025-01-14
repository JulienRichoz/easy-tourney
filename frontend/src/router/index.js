import { createRouter, createWebHistory } from 'vue-router';
import store from '../store';
import apiService from '@/services/apiService';
import { hasPermission } from '@/services/authService'; // Si tu utilises encore cette fonction
// Importation des fichiers de routes
import authRoutes from './authRoutes';
import adminRoutes from './adminRoutes';
import userRoutes from './userRoutes';

// Définition des routes de l'application
const routes = [...authRoutes, ...adminRoutes, ...userRoutes];

// Configuration du routeur Vue
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

/**
 * Vérifie si l'app est hors-ligne.
 */
function isOffline() {
  return !navigator.onLine;
}

// Avant chaque navigation
router.beforeEach(async (to, from, next) => {
  // Raccourcis pour l'état d'authentification
  const isAuthenticated = store.state.isAuthenticated;
  const userRole = store.state.user?.roleId;

  console.log('[router.beforeEach] isAuthenticated =', isAuthenticated);
  console.log('[router.beforeEach] userRole =', userRole);

  // 1) Si la route N'EXIGE PAS d'auth (ex: Login, Register, ou routes publiques)
  if (to.meta.requiresAuth === false) {
    // Si déjà connecté, on redirige vers /admin ou /tourneys selon le rôle
    if (isAuthenticated) {
      if (userRole === 1) {
        return next('/admin/tourneys');
      } else {
        return next('/tourneys');
      }
    }
    // Sinon, on laisse passer
    return next();
  }

  // 2) Si on se trouve sur la page Login/Register et qu'on est déjà authentifié
  if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
    if (userRole === 1) {
      return next('/admin/tourneys');
    } else {
      return next('/tourneys');
    }
  }

  // 3) Si la route EXIGE une authentification
  if (to.meta.requiresAuth) {
    // a) Vérifier l'authentification
    if (!isAuthenticated) {
      // Non connecté => on redirige vers /login
      store.dispatch('logout'); // au cas où on voudrait “nettoyer” le store
      return next('/login');
    }

    // b) Gérer le mode hors-ligne
    if (isOffline()) {
      // Si on est offline, on autorise /tourneys et /admin/tourneys
      if (to.path.startsWith('/tourneys')) {
        console.warn('Mode hors ligne : accès autorisé pour /tourneys.');
        return next();
      } else if (to.path.startsWith('/admin') && userRole === 1) {
        console.warn('Mode hors ligne : accès admin possible (données en cache).');
        return next();
      } else {
        console.warn('Mode hors ligne : route non autorisée => redirection /login.');
        return next('/login');
      }
    }

    // c) Vérifier les permissions spécifiques (si tu utilises `to.meta.permission`)
    if (to.meta.permission && !hasPermission(userRole, to.meta.permission)) {
      return next('/access-denied');
    }

    // d) Gestion du token d'invitation (inviteToken)
    const inviteToken = store.state.inviteToken;
    if (inviteToken) {
      try {
        // Le backend se charge de vérifier le token d'invitation
        // (Attention : ne pas confondre token d'invitation et JWT d'auth)
        const response = await apiService.post('/tourneys/join', { token: inviteToken });
        // Imaginons que le backend renvoie { tourneyId: X } 
        const { tourneyId } = response.data;

        // Nettoyer l'inviteToken côté store
        store.dispatch('clearInviteToken');

        // Rediriger vers la page join-team
        return next(`/tourneys/${tourneyId}/join-team`);
      } catch (err) {
        console.error('Erreur lors de la jonction au tournoi:', err);
        // Si erreur => on nettoie l'inviteToken et on continue
        store.dispatch('clearInviteToken');
      }
    }

    // e) Récupération/MAJ des données spécifiques aux tournois
    const isTournamentRoute =
      (to.path.startsWith('/tourneys/') || to.path.startsWith('/admin/tourneys/')) &&
      to.params.tourneyId;

    if (isTournamentRoute) {
      try {
        const tourneyId = to.params.tourneyId;
        await store.dispatch('tourney/fetchTourneyStatuses', tourneyId);
      } catch (error) {
        console.error('Erreur lors de la récupération du tournoi:', error);
        if (error.response && error.response.status === 404) {
          return next({ name: 'NotFoundPage' });
        } else {
          await store.dispatch('tourney/clearTournamentName');
        }
      }
    } else {
      // Nettoyer si on quitte une route de tournoi
      store.dispatch('tourney/clearTournamentName');
    }
  }

  // 4) Si aucune condition particulière => next() par défaut
  return next();
});

export default router;
