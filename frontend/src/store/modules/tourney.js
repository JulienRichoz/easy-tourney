// store/modules/tourney.js
// Description: Ce fichier contient le module Vuex pour la gestion des tournois.

import apiService from '@/services/apiService';
export default {
  namespaced: true,
  state: {
    currentTournamentName: '', // Stocker le nom du tournoi
    tourneyType: '', // Stocker le type du tournoi
    dateTourney: '', // Stocker la date du tournoi
    statuses: {
      status: 'draft',
      fieldAssignmentStatus: 'notStarted',
      sportAssignmentStatus: 'notStarted',
      registrationStatus: 'notStarted',
      poolStatus: 'notStarted',
      planningStatus: 'notStarted',
    },
  },
  mutations: {
    SET_TOURNAMENT_NAME(state, name) {
      state.currentTournamentName = name;
    },
    SET_TOURNAMENT_TYPE(state, tourneyType) {
      state.tourneyType = tourneyType;
    },
    SET_TOURNAMENT_DATE(state, dateTourney) {
      state.dateTourney = dateTourney;
    },
    CLEAR_TOURNAMENT_NAME(state) {
      state.currentTournamentName = '';
      state.currentTournamentDate = ''; // Réinitialise la date
    },
    SET_STATUSES(state, statuses) {
      state.statuses = { ...state.statuses, ...statuses };
    },
    UPDATE_STATUS(state, { key, value }) {
      state.statuses[key] = value;
    },
    RESET_TOURNEY_STATE(state) {
      state.currentTournamentName = ''; // Réinitialisation du nom du tournoi
      state.dateTourney = ''; // Réinitialisation de la date du tournoi
      state.statuses = {
        // Réinitialisation des statuts à un état "vide"
        status: null,
        fieldAssignmentStatus: null,
        sportAssignmentStatus: null,
        registrationStatus: null,
        planningStatus: null,
      };
    },
  },
  actions: {
    // Récupère les statuts du tournoi
    async fetchTourneyStatuses({ commit }, tourneyId) {
      try {
        const response = await apiService.get(
          `/tourneys/${tourneyId}/statuses`
        );
        const {
          name,
          tourneyType,
          dateTourney,
          status,
          registrationStatus,
          ...statuses
        } = response.data;
        commit('SET_TOURNAMENT_NAME', name);
        commit('SET_TOURNAMENT_TYPE', tourneyType);
        commit('SET_TOURNAMENT_DATE', dateTourney); // Mets à jour la date
        commit('SET_STATUSES', { ...statuses, status, registrationStatus });
      } catch (error) {
        console.error('Erreur lors de la récupération des statuts:', error);
        throw error;
      }
    },

    // Met à jour le statut du tournoi
    async updateStatus({ commit }, { tourneyId, key, value }) {
      try {
        await apiService.put(`/tourneys/${tourneyId}`, { [key]: value });
        commit('UPDATE_STATUS', { key, value });
      } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
      }
    },

    // Definit le nom du tournoi
    setTournamentName({ commit }, name) {
      commit('SET_TOURNAMENT_NAME', name);
    },
    // Efface le nom du tournoi
    clearTournamentName({ commit }) {
      commit('CLEAR_TOURNAMENT_NAME');
    },
  },
};
