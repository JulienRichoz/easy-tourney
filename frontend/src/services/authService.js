import { permissions, roles } from './permissions';
import apiService from './apiService';
import store from '../store';
import { jwtDecode } from 'jwt-decode';

// Vérifie si l'utilisateur a une permission spécifique
export function hasPermission(userRole, permission) {
    // Trouver la clé du rôle directement
    const roleKey = Object.entries(roles).find(([, value]) => value === userRole)?.[0];

    if (!roleKey) {
        return false;
    }

    // Accéder aux permissions du rôle
    const hasPerm = permissions[roles[roleKey]]?.includes(permission) ?? false;
    //console.log('hasPermission -> Permissions trouvées:', permissions[roles[roleKey]], 'Résultat:', hasPerm);

    return hasPerm;
}

export const logout = () => {
    // Supprimer le token du localStorage
    localStorage.removeItem('token');

    // Déconnecter l'utilisateur dans le store (ex: Vuex)
    store.commit('LOGOUT');

    // Rediriger vers la page de login
    //router.push({ name: 'Login' });
};

export const isTokenExpired = () => {
    const token = localStorage.getItem('token');
    if (!token) return true;

    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000; // Temps actuel en secondes
        return decoded.exp < currentTime; // true si le token est expiré
    } catch (error) {
        return true; // Si une erreur survient, considère le token comme expiré
    }
};

// Logout s'il est expiré
export const handleTokenExpiration = () => {
    if (isTokenExpired()) {
        logout();
    }
};

// Vérifie si l'utilisateur est authentifié en fonction du token présent
export function isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
}

// Vérifie si l'utilisateur est admin
export function isAdmin() {
    return store.state.user?.roleId === roles.ADMIN;
}

export function decodeToken(token) {
    try {
        return jwtDecode(token);
    } catch (error) {
        console.error('Erreur lors du décodage du token:', error);
        return null;
    }
}

// Rafraîchit le token JWT
export async function refreshToken() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Pas de token disponible pour le rafraîchissement.');
        }

        const response = await apiService.post('/auth/refresh-token');
        const newToken = response.data.token;

        // Vérifier que le nouveau token existe
        if (!newToken) {
            throw new Error('Erreur lors de l\'obtention du nouveau token.');
        }

        // Stocker le nouveau token et le définir dans l'en-tête Authorization
        localStorage.setItem('token', newToken);
        apiService.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        return newToken;
    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token :', error);
        throw error; // Pour propager l'erreur si le rafraîchissement échoue
    }
}
