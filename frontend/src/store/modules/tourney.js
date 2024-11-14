// store/modules/tourney.js

import apiService from '@/services/apiService';
export default {
    namespaced: true,
    state: {
        currentTournamentName: '', // Stocker le nom du tournoi
        tourneyType: '', // Stocker le type du tournoi
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
        SET_TOURNAMENT_TYPE(state, tourneyType) {
            state.tourneyType = tourneyType;
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
        RESET_TOURNEY_STATE(state) {
            state.currentTournamentName = '';  // Réinitialisation du nom du tournoi
            state.statuses = {                 // Réinitialisation des statuts à un état "vide"
                status: null,
                fieldAssignmentStatus: null,
                sportAssignmentStatus: null,
                registrationStatus: null,
                planningStatus: null,
            };
        }
    },
    actions: {
        async fetchTourneyStatuses({ commit }, tourneyId) {
            try {
                const response = await apiService.get(`/tourneys/${tourneyId}/statuses`);
                const { name, tourneyType, ...statuses } = response.data;
                commit('SET_TOURNAMENT_NAME', name);
                commit('SET_TOURNAMENT_TYPE', tourneyType);
                commit('SET_STATUSES', statuses);
            } catch (error) {
                console.error('Erreur lors de la récupération des statuts:', error);
                throw error;
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
