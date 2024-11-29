// store/modules/userTourney.js

import apiService from '@/services/apiService';
export default {
  namespaced: true,
  state: {
    activeTourney: null,
    selectedTourney: {}, // Stocker les données d'un tournoi spécifique
    tourneyRole: null,
  },
  mutations: {
    SET_ACTIVE_TOURNEY(state, tourney) {
      state.activeTourney = tourney;
    },
    SET_SELECTED_TOURNEY(state, tourney) {
      state.selectedTourney[tourney.id] = tourney; // Stocke les données par ID
    },
    SET_TOURNEY_ROLE(state, role) {
      state.tourneyRole = role;
    },
  },
  actions: {
    async fetchTourneyById({ state, commit }, tourneyId) {
      if (state.selectedTourney[tourneyId]) {
        return state.selectedTourney[tourneyId]; // Retourne les données si déjà chargées
      }
      try {
        const response = await apiService.get(`/tourneys/${tourneyId}`);
        const tourneyData = response.data;
        commit('SET_SELECTED_TOURNEY', tourneyData);
        return tourneyData;
      } catch (error) {
        console.error('Erreur lors de la récupération du tournoi :', error);
        throw error;
      }
    },
    async fetchActiveTourney({ commit, dispatch }) {
      try {
        const response = await apiService.get('/users/active-tourney');
        const activeTourneyData = response.data;

        if (activeTourneyData && activeTourneyData.status === 'active') {
          commit('SET_ACTIVE_TOURNEY', activeTourneyData);

          const tourneyId = activeTourneyData.id;
          if (tourneyId) {
            await dispatch('fetchTourneyRole', tourneyId);
          }
        } else {
          commit('SET_ACTIVE_TOURNEY', null);
          commit('SET_TOURNEY_ROLE', null);
        }
      } catch (error) {
        console.error(
          'Erreur lors de la récupération du tournoi actif :',
          error
        );
      }
    },
    async fetchTourneyRole({ commit }, tourneyId) {
      try {
        const response = await apiService.get(
          `/users/me/tourneys/${tourneyId}/role`
        );
        commit('SET_TOURNEY_ROLE', response.data.tourneyRole);
      } catch (error) {
        console.error(
          'Erreur lors de la récupération du rôle dans le tournoi :',
          error
        );
      }
    },
  },
  getters: {
    isAssistant(state) {
      return state.tourneyRole === 'assistant';
    },
    getTourneyById: (state) => (id) => {
      return state.selectedTourney[id];
    },
  },
};
