// frontend/src/services/authService.js

import { permissions, roles } from './permissions';
import apiService from './apiService';
import store from '../store';

/**
 * Vérifie si l'utilisateur a une permission spécifique
 */
export function hasPermission(userRole, permission) {
  const roleKey = Object.entries(roles).find(
    ([, value]) => value === userRole
  )?.[0];
  if (!roleKey) {
    return false;
  }
  // Accéder aux permissions du rôle
  return permissions[roles[roleKey]]?.includes(permission) ?? false;
}

/**
 * Déconnexion "manuelle" côté front.
 * - Supprime le cookie (si même domaine)
 * - Mutations store
 */
export const logout = () => {
  // Supprime le cookie local (précaution)
  document.cookie = 'token=; Max-Age=0; path=/';
  // Mutation store
  store.commit('LOGOUT');
};

/**
 * Vérifie si l'utilisateur est admin
 */
export function isAdmin() {
  return store.state.user?.roleId === roles.ADMIN;
}

/**
 * (Optionnel) Rafraîchit le token JWT en appelant l'endpoint dédié.
 * Le backend mettra à jour le cookie (httpOnly).
 */
export async function refreshToken() {
  try {
    await apiService.post('/auth/refresh-token');
    // Si succès, le cookie est mis à jour côté serveur
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token :', error);
    throw error;
  }
}
