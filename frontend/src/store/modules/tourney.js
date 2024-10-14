// store/modules/tourney.js
import axios from 'axios';

export default {
    namespaced: true,
    state: {
        currentTourney: null, // Holds the details of the current tournament
    },
    mutations: {
        SET_TOURNEY(state, tourney) {
            state.currentTourney = tourney;
        },
        CLEAR_TOURNEY(state) {
            state.currentTourney = null;
        },
    },
    actions: {
        async fetchTourney({ commit }, tourneyId) {
            try {
                const response = await axios.get(`/api/tourneys/${tourneyId}`);
                commit('SET_TOURNEY', response.data);
            } catch (error) {
                console.error('Error fetching tournament:', error);
            }
        },
        clearTourney({ commit }) {
            commit('CLEAR_TOURNEY');
        },
    },
};
