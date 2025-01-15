// store/modules/userTourney.js
// Description: Ce fichier contient le module Vuex pour la gestion des utilisateurs dans un tournoi.
// Filtres, rôles et données spécifiques à un tournoi sont gérés ici.

import apiService from '@/services/apiService';
export default {
  namespaced: true,
  state: {
    activeTourney: null,
    selectedTourney: {}, // Stocker les données d'un tournoi spécifique
    tourneyRole: null,
    // Filter planning page:
    selectedPoolId: null,
    selectedFieldId: null,
    selectedGameId: null,
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
    SET_SELECTED_POOL(state, poolId) {
      state.selectedPoolId = poolId;
    },
    SET_SELECTED_FIELD(state, fieldId) {
      state.selectedFieldId = fieldId;
    },
    SET_SELECTED_GAME(state, gameId) {
      state.selectedGameId = gameId;
    },
    RESET_FILTERS(state) {
      state.selectedPoolId = null;
      state.selectedFieldId = null;
      state.selectedGameId = null;
    },
  },
  actions: {
    //Récupérer les données du tournoi par id
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

    // Récupère les tournois de l'utilisateur
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

    // récupère le role de l'utilisateur dans le tournoi
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

    // Se souvenir des filtres de la page de planification
    setSelectedPool({ commit }, poolId) {
      commit('SET_SELECTED_POOL', poolId);
    },
    setSelectedField({ commit }, fieldId) {
      commit('SET_SELECTED_FIELD', fieldId);
    },
    setSelectedGame({ commit }, gameId) {
      commit('SET_SELECTED_GAME', gameId);
    },
    resetFilters({ commit }) {
      commit('RESET_FILTERS');
    },
  },
  getters: {
    isAssistant(state) {
      return state.tourneyRole === 'assistant';
    },
    getTourneyById: (state) => (id) => {
      return state.selectedTourney[id];
    },

    // FILTERS
    selectedPoolId: (state) => state.selectedPoolId,
    selectedFieldId: (state) => state.selectedFieldId,
    selectedGameId: (state) => state.selectedGameId,
  },
};
