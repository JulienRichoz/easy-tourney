// src/services/socketService.js
// Description: Ce fichier contient une fonction pour initialiser une connexion Socket.IO avec le serveur.

import { io } from 'socket.io-client';

let socket = null;

/**
 * Récupère une instance de socket.io-client pour communiquer avec
 * @returns socket.io-client instance
 */
export function getSocket() {
    if (!socket) {
        const token = localStorage.getItem('token');
        if (!token) {
            // Ne pas créer de socket si l'utilisateur n'est pas authentifié
            return null;
        }
        socket = io(process.env.VUE_APP_IMAGE_URL || 'http://localhost:3000', {
            auth: {
                token,
            },
            reconnectionAttempts: 5,
            reconnectionDelay: 5000,
        });

        // Gestion des erreurs et des événements
        socket.on('connect_error', (err) => {
            console.error('Erreur de connexion Socket.IO :', err.message);
        });

        socket.on('disconnect', (reason) => {
            console.warn('Socket déconnecté :', reason);
        });
    }
    return socket;
}
