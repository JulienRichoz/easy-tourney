import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const apiService = axios.create({
    baseURL: API_URL,
});

// Ajoute le token si disponible
apiService.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    console.log('apiService -> token', token);
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

export default apiService;
