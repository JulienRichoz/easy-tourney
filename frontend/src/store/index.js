import { createStore } from 'vuex';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Import the 'jwtDecode' function

export default createStore({
  state: {
    isAuthenticated: !!localStorage.getItem('token'), // On vérifie si un token est déjà présent
    user: null,
  },
  mutations: {
    SET_AUTH(state, payload) {
      state.isAuthenticated = payload.isAuthenticated;
      state.user = payload.user;
    },
    LOGOUT(state) {
      state.isAuthenticated = false;
      state.user = null;
    }
  },
  actions: {
    async login({ commit }, { email, password }) {
      const response = await axios.post('/api/auth/login', { email, password });
      const token = response.data.token;

      localStorage.setItem('token', token);  // Stocke le token dans localStorage
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;  // Définit l'en-tête d'autorisation
      commit('SET_AUTH', { isAuthenticated: true, user: response.data.user });
    },
    logout({ commit }) {
      localStorage.removeItem('token');  // Supprime le token de localStorage
      delete axios.defaults.headers.common['Authorization'];  // Supprime l'en-tête d'autorisation

      commit('LOGOUT');  // Réinitialise l'état
    },

    // Nouvelle action pour restaurer l'état d'authentification à partir du token
    initializeAuth({ commit }) {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        commit('SET_AUTH', {
          isAuthenticated: true,
          user: decoded,
        });
      }
    }
  }
});
