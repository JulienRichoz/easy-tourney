// server/socketHandlers/gameSockets.js
const { Game, GameEvent } = require('../models');
const tourneyRoles = require('../config/tourneyRoles');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('Nouvelle connexion WebSocket :', socket.id);

        // Rejoindre une salle spécifique pour un match
        socket.on('joinGame', (gameId) => {
            socket.join(`game_${gameId}`);
            console.log(`Socket ${socket.id} a rejoint la salle game_${gameId}`);
        });

        // Quitter la salle du match
        socket.on('leaveGame', (gameId) => {
            socket.leave(`game_${gameId}`);
            console.log(`Socket ${socket.id} a quitté la salle game_${gameId}`);
        });

        // Recevoir les mises à jour de l'arbitre
        socket.on('updateScore', async (data) => {
            const { tourneyId, gameId, scoreTeamA, scoreTeamB } = data;

            // Vérifier si l'utilisateur est autorisé
            const isAuthorized = socket.user.tourneyRoles.some(
                (tr) =>
                    tr.tourneyId === tourneyId &&
                    (tr.role === tourneyRoles.ADMIN || tr.role === tourneyRoles.ASSISTANT)
            );

            if (!isAuthorized) {
                return socket.emit('error', 'Vous n\'êtes pas autorisé à mettre à jour le score.');
            }

            try {
                // Charger l'instance complète du match
                const game = await Game.findByPk(gameId);
                if (!game) {
                    return socket.emit('error', 'Le match spécifié n\'existe pas.');
                }

                // Mettre à jour les scores
                game.scoreTeamA = scoreTeamA;
                game.scoreTeamB = scoreTeamB;

                // Enregistrer les changements
                await game.save();

                // Envoyer la mise à jour aux utilisateurs dans la salle du match
                io.to(`game_${gameId}`).emit('scoreUpdated', { scoreTeamA, scoreTeamB });
            } catch (error) {
                console.error('Erreur lors de la mise à jour du score :', error);
                socket.emit('error', 'Erreur lors de la mise à jour du score.');
            }
        });

        // Recevoir les événements du match
        socket.on('gameEvent', async (data) => {
            const { tourneyId, gameId, event } = data;

            // Vérifier si l'utilisateur est autorisé (assistant ou admin du tournoi)
            const isAuthorized = socket.user.tourneyRoles.some(
                (tr) =>
                    tr.tourneyId === data.tourneyId &&
                    (tr.role === 'assistant' || tr.role === 'admin')
            );

            if (!isAuthorized) {
                return socket.emit('error', 'Vous n\'êtes pas autorisé à émettre des événements de match.');
            }

            // Enregistrer l'événement en base de données
            const gameEvent = await GameEvent.create({
                gameId,
                teamId: event.teamId,
                type: event.type,
                description: event.description,
                matchTime: event.matchTime,
            });

            // Diffuser l'événement aux utilisateurs
            io.to(`game_${gameId}`).emit('gameEvent', gameEvent);
        });

        socket.on('disconnect', () => {
            console.log('Un utilisateur est déconnecté :', socket.id);
        });
    });
};
