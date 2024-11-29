// store/modules/userTourney.js

import apiService from '@/services/apiService';
export default {
  namespaced: true,
  state: {
    activeTourney: null,
    tourneyRole: null,
  },
  mutations: {
    SET_ACTIVE_TOURNEY(state, tourney) {
      state.activeTourney = tourney;
    },
    SET_TOURNEY_ROLE(state, role) {
      state.tourneyRole = role;
    },
  },
  actions: {
    async fetchActiveTourney({ commit }) {
      try {
        const response = await apiService.get('/users/active-tourney');
        commit('SET_ACTIVE_TOURNEY', response.data);
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
  },
};
