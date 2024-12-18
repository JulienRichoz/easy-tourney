import axios from 'axios';

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';
export const BASE_URL = process.env.VUE_APP_BASE_URL || 'http://localhost:8080';
console.log('API_URL:', API_URL);
console.log('BASE_URL:', BASE_URL);

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
