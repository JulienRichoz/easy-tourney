// store/modules/user.js
import apiService from '@/services/apiService';

export default {
  namespaced: true,
  state: {
    activeTourney: null,
    // ... autres états
  },
  mutations: {
    SET_ACTIVE_TOURNEY(state, tourney) {
      state.activeTourney = tourney;
    },
    // ... autres mutations
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
  },
  getters: {},
};
