import { permissions, roles } from './permissions';
import apiService from './apiService';
import store from '../store';

const authService = {
    hasPermission(userRole, permission) {
        const roleKey = Object.keys(roles).find(key => roles[key] === userRole);
        if (!roleKey) return false;

        return permissions[roleKey]?.includes(permission) ?? false;
    },
    isAuthenticated() {
        return !!store.state.isAuthenticated;
    },
    isAdmin() {
        return store.state.user?.roleId === 1; // Supposons que '1' représente l'admin
    },
};

export default authService;

export async function refreshToken() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Pas de token disponible pour le rafraîchissement.');
        }

        const response = await apiService.post('/auth/refresh-token');
        const newToken = response.data.token;

        // Stocker le nouveau token et le définir dans l'en-tête Authorization
        localStorage.setItem('token', newToken);
        apiService.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        return newToken;
    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token :', error);
        throw error;  // Pour propager l'erreur si le rafraîchissement échoue
    }
}
