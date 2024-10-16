import { createStore } from 'vuex';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Import the 'jwtDecode' function
import tourney from './modules/tourney';

export default createStore({
  modules: {
    tourney,
  },
  state: {
    isAuthenticated: !!localStorage.getItem('token'), // On vérifie si un token est déjà présent
    user: null,
    tokenExpiration: null,
  },
  mutations: {
    SET_AUTH(state, payload) {
      state.isAuthenticated = payload.isAuthenticated;
      state.user = payload.user;
      state.tokenExpiration = payload.tokenExpiration;

    },
    LOGOUT(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.tokenExpiration = null;
    },
    SET_ALERT_MESSAGE(state, message) {
      state.alertMessage = message;
    },
    CLEAR_ALERT_MESSAGE(state) {
      state.alertMessage = null;
    },
  },
  actions: {
    async login({ commit }, { email, password }) {
      try {
        const response = await axios.post('/api/auth/login', { email, password });
        const { token, expiresIn } = response.data;

        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        commit('SET_AUTH',
          { isAuthenticated: true, user: response.data.user, expiresIn });

      } catch (error) {
        console.error('Erreur de connexion:', error);
        throw error;
      }
    },
    logout({ commit }) {
      localStorage.removeItem('token');  // Supprime le token de localStorage
      delete axios.defaults.headers.common['Authorization'];  // Supprime l'en-tête d'autorisation

      commit('LOGOUT');  // Réinitialise l'état
    },

    /*
      * Initialiser l'authentification
      * Vérifie si un token est présent dans le localStorage
      * Si le token est valide, décodez-le et mettez à jour l'état de l'authentification
      */
    initializeAuth({ commit }) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const currentTime = Math.floor(Date.now() / 1000); // Temps actuel en secondes

          if (decoded.exp && currentTime < decoded.exp) {
            // Si le token n'est pas expiré
            commit('SET_AUTH', {
              isAuthenticated: true,
              user: decoded,
              tokenExpiration: decoded.exp,  // On récupère l'expiration
            });
          } else {
            // Si le token est expiré, effectuer un logout
            commit('LOGOUT');
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error("Erreur lors du décodage du token:", error);
          commit('LOGOUT');
          localStorage.removeItem('token');
        }
      }
    }

  }
});
