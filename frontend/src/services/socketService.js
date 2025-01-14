// src/services/socketService.js

import { io } from 'socket.io-client';
import store from '@/store';

let socket = null;

/**
 * Récupère (ou crée) la socket.
 * - On ne lit plus le token, on laisse le cookie httpOnly être géré automatiquement.
 * - On n'initialise la socket que si l'utilisateur est authentifié (stock Vuex).
 */
export function getSocket() {
    // Si déjà créé, on renvoie la même instance
    if (socket) {
        return socket;
    }

    // Vérifie si l'utilisateur est authentifié dans le store
    const isAuthenticated = store.state.isAuthenticated;
    if (!isAuthenticated) {
        // Pas d'utilisateur loggé => pas de socket
        return null;
    }

    // Crée la socket, en autorisant l'envoi de cookies
    socket = io(process.env.VUE_APP_IMAGE_URL || 'http://localhost:3000', {
        withCredentials: true, // le cookie httpOnly sera envoyé au handshake
        reconnectionAttempts: 5,
        reconnectionDelay: 5000,
    });

    // Gestion des erreurs
    socket.on('connect_error', (err) => {
        console.error('Erreur de connexion Socket.IO :', err.message);
    });

    socket.on('disconnect', (reason) => {
        console.warn('Socket déconnecté :', reason);
    });

    return socket;
}
