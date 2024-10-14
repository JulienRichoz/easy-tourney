// store/modules/tourney.js
export default {
    state: {
        currentTournamentName: '', // Stocker le nom du tournoi
    },
    mutations: {
        SET_TOURNAMENT_NAME(state, name) {
            state.currentTournamentName = name;
        },
        CLEAR_TOURNAMENT_NAME(state) {
            state.currentTournamentName = '';
        },
    },
    actions: {
        setTournamentName({ commit }, name) {
            commit('SET_TOURNAMENT_NAME', name);
        },
        clearTournamentName({ commit }) {
            commit('CLEAR_TOURNAMENT_NAME');
        },
    },
};
