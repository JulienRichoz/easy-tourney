// frontend/src/services/apiService.js
import axios from 'axios';
import store from '@/store';
import router from '@/router';

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';
export const BASE_URL = process.env.VUE_APP_BASE_URL || 'http://localhost:8080';

const apiService = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Inclut les cookies dans les requêtes
});

// (Optionnel) Tu peux configurer des interceptors pour gérer des réponses 401, etc.
// Par exemple :
// apiService.js
apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.warn('Network error ou backend down');
      return Promise.reject(error);
    }

    const status = error.response.status;
    switch (status) {
      case 401:
        console.warn('401 => token expiré ou invalide => logout + /login');
        store.dispatch('logout');
        router.push('/login');
        break;
      case 403:
        console.warn('403 => pas les droits => /access-denied');
        router.push('/access-denied');
        break;
      case 404:
        console.warn('404 => page non trouvée => /404 (ou vue NotFound)');
        router.push('/404');
        break;
      default:
        console.warn('Erreur HTTP inattendue => on fait rien de spécial ?');
    }

    return Promise.reject(error);
  }
);


export default apiService;
