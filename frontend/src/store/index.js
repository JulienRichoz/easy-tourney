// src/store/index.js
// Description: Ce fichier contient la configuration du store Vuex de l'application.
// Il gère l'état global de l'application, les mutations et les actions pour l'authentification et d'autres fonctionnalités.

import { createStore } from 'vuex';
import apiService from '@/services/apiService';
import { jwtDecode } from 'jwt-decode'; // Import the 'jwtDecode' function
import tourney from './modules/tourney';
import userTourney from './modules/userTourney';
import { getSocket } from '@/services/socketService';

export default createStore({
  modules: {
    tourney,
    userTourney,
  },

  // Initial state
  state: {
    isAuthenticated: !!localStorage.getItem('token'), // On vérifie si un token est déjà présent
    user: null,
    tokenExpiration: null,
    inviteToken: localStorage.getItem('inviteToken') || null, // vérifier si un token d'invitation est présent
  },
  mutations: {
    // Authentification
    SET_AUTH(state, payload) {
      state.isAuthenticated = payload.isAuthenticated;
      state.user = payload.user;
      state.tokenExpiration = payload.tokenExpiration;
    },
    // Déconnexion
    LOGOUT(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.tokenExpiration = null;
      state.inviteToken = null; // Reset du token d'invitation lors du logout
      localStorage.removeItem('inviteToken');
      this.commit('tourney/RESET_TOURNEY_STATE');
    },
    SET_ALERT_MESSAGE(state, message) {
      state.alertMessage = message;
    },
    CLEAR_ALERT_MESSAGE(state) {
      state.alertMessage = null;
    },
    UPDATE_USER_NAME(state, newName) {
      if (state.user) {
        state.user.name = newName;
      }
    },
    SET_INVITE_TOKEN(state, token) {
      state.inviteToken = token;
      localStorage.setItem('inviteToken', token);
    },
    CLEAR_INVITE_TOKEN(state) {
      state.inviteToken = null;
      localStorage.removeItem('inviteToken');
    },
  },
  actions: {
    /**
     * Login action pour l'authentification de l'utilisateur
     * @param {*} param0 
     * @param {*} param1 
     */
    async login({ commit }, { email, password }) {
      try {
        const response = await apiService.post('/auth/login', {
          email,
          password,
        });
        const { token, expiresIn } = response.data;

        localStorage.setItem('token', token);
        apiService.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Récupérer les informations de l'utilisateur depuis le serveur
        const userResponse = await apiService.get('/users/me');
        const user = userResponse.data;

        commit('SET_AUTH', { isAuthenticated: true, user, expiresIn });
      } catch (error) {
        console.error('Erreur de connexion:', error);
        throw error;
      }
    },

    // Déconnexion
    logout({ commit }) {
      localStorage.removeItem('token'); // Supprime le token de localStorage
      // Déconnecter le socket
      let socket = getSocket();
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      delete apiService.defaults.headers.common['Authorization']; // Supprime l'en-tête d'autorisation

      commit('LOGOUT'); // Réinitialise l'état
    },

    // Enregistrer le token d'invitation
    saveInviteToken({ commit }, token) {
      commit('SET_INVITE_TOKEN', token);
    },

    // Effacer le token d'invitation
    clearInviteToken({ commit }) {
      commit('CLEAR_INVITE_TOKEN');
    },
    /*
     * Initialiser l'authentification
     * Vérifie si un token est présent dans le localStorage
     * Si le token est valide, le decoder et mettre à jour l'état de l'authentification
     */
    async initializeAuth({ commit }) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const currentTime = Math.floor(Date.now() / 1000); // Temps actuel en secondes

          if (decoded.exp && currentTime < decoded.exp) {
            // Si le token n'est pas expiré
            apiService.defaults.headers.common[
              'Authorization'
            ] = `Bearer ${token}`;
            // Récupérer les informations de l'utilisateur depuis le serveur
            const response = await apiService.get('/users/me');
            const user = response.data;

            commit('SET_AUTH', {
              isAuthenticated: true,
              user,
              tokenExpiration: decoded.exp, // On récupère l'expiration
            });
          } else {
            // Si le token est expiré, effectuer un logout
            commit('LOGOUT');
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Erreur lors du décodage du token:', error);
          commit('LOGOUT');
          localStorage.removeItem('token');
        }
      }
    },
  },
});
