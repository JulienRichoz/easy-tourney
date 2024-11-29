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
    async fetchActiveTourney({ commit, dispatch }) {
      try {
        const response = await apiService.get('/users/active-tourney');
        const activeTourneyData = response.data;
        console.log('activeTourneyData', activeTourneyData);
        if (activeTourneyData && activeTourneyData.status === 'active') {
          commit('SET_ACTIVE_TOURNEY', activeTourneyData);

          const tourneyId = activeTourneyData.id;
          if (tourneyId) {
            await dispatch('fetchTourneyRole', tourneyId);
          }
        } else {
          // Si aucun tournoi actif, on peut gérer cela ici
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
  },
};
