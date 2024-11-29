// src/router/tourneyGuard.js
import store from '@/store';
import { isAdmin } from '@/services/authService';
import apiService from '@/services/apiService';

export async function checkTournamentAccess(to, from, next) {
  const userRole = store.getters['auth/userRole'];
  const tourneyId = to.params.tourneyId;

  if (isAdmin(userRole)) {
    return next(); // Les admins ont accès libre
  }

  try {
    // Vérifie si l'utilisateur est associé au tournoi
    const response = await apiService.get(
      `/users/me/tourneys/${tourneyId}/role`
    );
    const userRole = response.data.tourneyRole;
    if (userRole) {
      // Stocke le rôle dans le store si nécessaire
      store.commit('userTourney/SET_TOURNEY_ROLE', userRole);
      return next();
    } else {
      return next('/access-denied');
    }
  } catch (error) {
    console.error(
      "Erreur lors de la vérification de l'accès au tournoi:",
      error
    );
    return next('/access-denied');
  }
}

export async function checkTourneyRules(to, from, next) {
  const userRole = store.getters['auth/userRole'];
  const tourneyId = to.params.tourneyId;

  if (isAdmin(userRole)) {
    return next(); // Les admins ont toujours accès
  }

  try {
    // Charger les données du tournoi depuis le store
    const tourney = await store.dispatch(
      'userTourney/fetchTourneyById',
      tourneyId
    );

    if (!tourney) {
      return next('/access-denied'); // Si le tournoi n'existe pas
    }

    // Conditions pour accéder aux différentes pages
    const isTourneyActiveOrCompleted = ['active', 'completed'].includes(
      tourney.status
    );
    const isRegistrationActiveOrCompleted = ['active', 'completed'].includes(
      tourney.registrationStatus
    );

    // Vérification des permissions en fonction du statut du tournoi
    if (isTourneyActiveOrCompleted) {
      return next(); // Accès total si le tournoi est actif ou terminé
    }

    if (
      ['draft', 'ready'].includes(tourney.status) &&
      isRegistrationActiveOrCompleted
    ) {
      // Accès restreint si le tournoi est en mode "draft" ou "ready" mais l'inscription est active ou terminée
      const restrictedPaths = [
        `/tourneys/${tourneyId}/join-team`,
        `/tourneys/${tourneyId}/teams/${to.params.teamId}/details`,
      ];

      if (restrictedPaths.includes(to.path)) {
        return next(); // Accès autorisé pour ces pages spécifiques
      }

      return next('/access-denied'); // Accès refusé pour les autres pages
    }

    return next('/access-denied'); // Par défaut, accès refusé
  } catch (error) {
    console.error(
      'Erreur lors de la vérification des règles du tournoi :',
      error
    );
    return next('/access-denied');
  }
}
