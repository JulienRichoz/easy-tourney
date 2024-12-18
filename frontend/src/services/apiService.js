import axios from 'axios';

const API_URL = process.env.VUE_APP_API_URL || 'https://easy-tourney-backend-6cdfc7a64550.herokuapp.com/api';
export const BASE_URL = process.env.VUE_APP_BASE_URL || 'https://easy-tourney-frontend-899109fd59ab.herokuapp.com';

const apiService = axios.create({
  baseURL: API_URL,
});

// Ajoute le token si disponible
apiService.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default apiService;
