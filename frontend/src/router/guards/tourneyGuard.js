// src/router/tourneyGuard.js

import store from '@/store';
import { isAdmin } from '@/services/authService';
import apiService from '@/services/apiService';

export async function checkTournamentAccess(to, from, next) {
  const isOffline = !navigator.onLine;
  const userRole = store.getters['auth/userRole'];
  const tourneyId = to.params.tourneyId;

  if (isAdmin(userRole)) {
    return next(); // Les admins ont accès libre
  }

  // Si hors ligne
  if (isOffline) {
    // Vérifier si on a des données en cache pour ce tournoi
    const cachedData = localStorage.getItem(`planning-${tourneyId}`);
    if (cachedData) {
      // On a des données locales, on autorise la navigation
      return next();
    } else {
      // Pas de données, retour à /tourneys
      return next('/tourneys');
    }
  }

  try {
    // Vérifie si l'utilisateur est associé au tournoi
    const response = await apiService.get(
      `/users/me/tourneys/${tourneyId}/role`
    );
    const userRoleInTourney = response.data.tourneyRole;
    if (userRoleInTourney) {
      // Stocke le rôle dans le store
      store.commit('userTourney/SET_TOURNEY_ROLE', userRoleInTourney);
      return next();
    } else {
      // Si l'utilisateur essaie déjà d'accéder à '/tourneys', laisser passer
      if (to.path === '/tourneys') {
        return next();
      }
      // Sinon, rediriger vers la liste des tournois
      return next('/tourneys');
    }
  } catch (error) {
    console.error(
      "Erreur lors de la vérification de l'accès au tournoi:",
      error
    );
    // Si l'utilisateur essaie déjà d'accéder à '/tourneys', laisser passer
    if (to.path === '/tourneys') {
      return next();
    }
    return next('/tourneys'); // Redirection en cas d'erreur
  }
}

export async function checkTourneyRules(to, from, next) {
  const isOffline = !navigator.onLine;
  const userRole = store.getters['auth/userRole'];
  const tourneyId = to.params.tourneyId;

  if (isAdmin(userRole)) {
    return next(); // Les admins ont toujours accès
  }

  // Si hors ligne
  if (isOffline) {
    // Vérifier si on a des données en cache pour ce tournoi
    const cachedData = localStorage.getItem(`planning-${tourneyId}`);
    if (cachedData) {
      // On a des données locales, on autorise la navigation
      return next();
    } else {
      // Pas de données, retour à /tourneys
      return next('/tourneys');
    }
  }

  try {
    // Charger les données du tournoi depuis le store
    const tourney = await store.dispatch(
      'userTourney/fetchTourneyById',
      tourneyId
    );

    if (!tourney) {
      // Redirection vers la liste des tournois si le tournoi n'existe pas
      return next('/tourneys');
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

      // Redirection vers la liste des tournois au lieu de 'access-denied'
      return next('/tourneys');
    }

    // Par défaut, redirection vers la liste des tournois
    return next('/tourneys');
  } catch (error) {
    console.error(
      'Erreur lors de la vérification des règles du tournoi :',
      error
    );
    return next('/tourneys'); // Redirection en cas d'erreur
  }
}
