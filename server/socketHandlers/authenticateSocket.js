// server/socketHandlers/authenticateSocket.js

const { UsersTourneys } = require('../models');
const authService = require('../services/authService');
const cookie = require('cookie');


module.exports = async (socket, next) => {
    try {
        // Récupérer la chaîne de cookies dans l'en-tête
        const cookieString = socket.handshake.headers.cookie || '';
        // Parser les cookies
        const parsedCookies = cookie.parse(cookieString);

        // On récupère le JWT dans le cookie "token"
        const token = parsedCookies.token;

        if (!token) {
            return next(new Error('Authentication error: No token found in cookies'));
        }

        // Vérifier le token
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
