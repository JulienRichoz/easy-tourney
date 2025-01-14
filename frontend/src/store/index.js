// frontend/src/store/index.js

import { createStore } from 'vuex';
import apiService from '@/services/apiService';
import tourney from './modules/tourney';
import userTourney from './modules/userTourney';
import { getSocket } from '@/services/socketService';

export default createStore({
  modules: {
    tourney,
    userTourney,
  },
  state: {
    // Booleen d'auth
    isAuthenticated: false,
    // Objet représentant l'utilisateur connecté
    user: null,
    // Token d'invitation (si tu en as besoin côté front)
    inviteToken: localStorage.getItem('inviteToken') || null,
  },
  mutations: {
    // Mettre à jour l'état d'auth
    SET_AUTH(state, payload) {
      state.isAuthenticated = payload.isAuthenticated;
      state.user = payload.user || null;
    },

    // Déconnecter localement
    LOGOUT(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.inviteToken = null;
      // On peut aussi forcer la suppression du cookie côté client
      // (si le domaine/chemin match) :
      document.cookie = 'token=; Max-Age=0; path=/';

      // On réinitialise si besoin le module "tourney"
      this.commit('tourney/RESET_TOURNEY_STATE');
    },

    // Gérer un message d'alerte (optionnel)
    SET_ALERT_MESSAGE(state, message) {
      state.alertMessage = message;
    },
    CLEAR_ALERT_MESSAGE(state) {
      state.alertMessage = null;
    },

    // Exemple de mise à jour du username dans l'état
    UPDATE_USER_NAME(state, newName) {
      if (state.user) {
        state.user.name = newName;
      }
    },

    // Gestion du token d'invitation
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
     * Action de login
     * 1) POST /auth/login => le serveur place le cookie httpOnly
     * 2) GET /users/me => récupérer le user
     * 3) commit SET_AUTH
     */
    async login({ commit }, { email, password }) {
      try {
        // 1) Login
        await apiService.post('/auth/login', { email, password });
        // => le cookie est maintenant défini côté navigateur (httpOnly)

        // 2) Récupérer l'utilisateur
        const userResponse = await apiService.get('/users/me');
        console.log('[login] /users/me =>', userResponse.data);

        // 3) Mettre à jour le store
        commit('SET_AUTH', {
          isAuthenticated: true,
          user: userResponse.data,
        });
      } catch (error) {
        console.error('[login] Erreur de connexion:', error);
        throw error;
      }
    },

    /**
     * Action de logout
     * 1) Facultatif: requête POST /auth/logout => backend supprime/expirie le cookie
     * 2) commit('LOGOUT') local
     */
    async logout({ commit }) {
      try {
        // (Optionnel) appel backend si tu veux un endpoint de déconnexion
        await apiService.post('/auth/logout');
        // => le backend peut faire res.clearCookie('token') etc.

        // Déconnecter le socket
        let socket = getSocket();
        if (socket) {
          socket.disconnect();
          socket = null;
        }

        // 2) Déconnexion locale
        commit('LOGOUT');
      } catch (error) {
        console.error('[logout] Erreur lors du logout:', error);
      }
    },

    // Sauvegarder un token d'invitation
    saveInviteToken({ commit }, token) {
      commit('SET_INVITE_TOKEN', token);
    },

    // Nettoyer le token d'invitation
    clearInviteToken({ commit }) {
      commit('CLEAR_INVITE_TOKEN');
    },

    /**
     * initializeAuth()
     * Appelée au démarrage de l'app (ex: dans App.vue ou main.js)
     * -> Vérifie si on est déjà authentifié
     *    en appelant /users/me (ou un endpoint similaire)
     */
    async initializeAuth({ commit }) {
      try {
        // 1) On demande au backend si on a un cookie valide
        const response = await apiService.get('/users/me');
        console.log('[initializeAuth] /users/me =>', response.data);

        // 2) Si 200 => user connecté
        commit('SET_AUTH', {
          isAuthenticated: true,
          user: response.data,
        });
      } catch (error) {
        // 3) Si 401 ou autre => pas connecté
        console.warn('[initializeAuth] Non authentifié ou erreur => LOGOUT');
        commit('LOGOUT');
      }
    },
  },
});
