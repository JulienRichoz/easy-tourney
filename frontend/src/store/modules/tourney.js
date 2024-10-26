// store/modules/tourney.js

import apiService from '@/services/apiService';
export default {
    namespaced: true,
    state: {
        currentTournamentName: '', // Stocker le nom du tournoi
        statuses: {
            status: 'draft',
            fieldAssignmentStatus: 'notStarted',
            sportAssignmentStatus: 'notStarted',
            registrationStatus: 'notStarted',
            planningStatus: 'notStarted'
        }
    },
    mutations: {
        SET_TOURNAMENT_NAME(state, name) {
            state.currentTournamentName = name;
        },
        CLEAR_TOURNAMENT_NAME(state) {
            state.currentTournamentName = '';
        },
        SET_STATUSES(state, statuses) {
            state.statuses = { ...state.statuses, ...statuses };
        },
        UPDATE_STATUS(state, { key, value }) {
            state.statuses[key] = value;
        },
    },
    actions: {
        async fetchTourneyStatuses({ commit }, tourneyId) {
            try {
                const response = await apiService.get(`/tourneys/${tourneyId}/statuses`);
                commit('SET_STATUSES', response.data);
            } catch (error) {
                console.error('Erreur lors de la récupération des statuts:', error);
            }
        },
        async updateStatus({ commit }, { tourneyId, key, value }) {
            try {
                await apiService.put(`/tourneys/${tourneyId}`, { [key]: value });
                commit('UPDATE_STATUS', { key, value });
            } catch (error) {
                console.error('Erreur lors de la mise à jour du statut:', error);
            }
        },
        setTournamentName({ commit }, name) {
            commit('SET_TOURNAMENT_NAME', name);
        },
        clearTournamentName({ commit }) {
            commit('CLEAR_TOURNAMENT_NAME');
        },
    },
};
