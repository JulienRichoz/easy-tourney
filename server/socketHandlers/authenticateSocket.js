// server/socketHandlers/authenticateSocket.js

const { UsersTourneys } = require('../models');
const authService = require('../services/authService');

module.exports = async (socket, next) => {
    try {
        // Récupérer le token depuis l'authentification Socket.IO
        let token = socket.handshake.auth.token;

        // Si le token n'est pas présent, vérifier s'il est dans les en-têtes
        if (!token && socket.handshake.headers && socket.handshake.headers.authorization) {
            const authHeader = socket.handshake.headers.authorization;
            token = authHeader && authHeader.split(' ')[1];
        }

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        // Si le token commence par 'Bearer ', le retirer
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length);
        }

        // Utiliser le service d'authentification pour vérifier le token
        const decoded = authService.verifyToken(token);
        if (!decoded) {
            return next(new Error('Authentication error: Invalid token'));
        }

        // Ajouter l'utilisateur au socket
        socket.user = {
            id: decoded.id,
            name: decoded.name,
            email: decoded.email,
            roleId: decoded.roleId,
        };

        // Récupérer les rôles de l'utilisateur dans les tournois
        const userTourneys = await UsersTourneys.findAll({
            where: { userId: socket.user.id },
        });

        socket.user.tourneyRoles = userTourneys.map((ut) => ({
            tourneyId: ut.tourneyId,
            role: ut.tourneyRole,
        }));

        next();
    } catch (error) {
        console.error('Erreur lors de l\'authentification du socket :', error);
        next(new Error('Authentication error'));
    }
};
