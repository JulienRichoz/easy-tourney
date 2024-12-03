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

        // Recevoir la mise en pause du timer
        socket.on('pauseMatchTimer', async (data) => {
            const { matchId } = data;

            const game = await Game.findByPk(matchId);
            if (!game) {
                return socket.emit('error', 'Le match spécifié n\'existe pas.');
            }

            const tourneyId = game.tourneyId;
            const isAuthorized = socket.user.tourneyRoles.some(
                (tr) =>
                    tr.tourneyId === tourneyId &&
                    (tr.role === 'admin' || tr.role === 'assistant')
            );

            if (!isAuthorized) {
                return socket.emit('error', 'Vous n\'êtes pas autorisé à mettre en pause le timer du match.');
            }

            try {
                // Diffuser l'événement de pause du timer
                io.to(`game_${matchId}`).emit('pauseMatchTimer', { matchId });
            } catch (error) {
                console.error('Erreur lors de la mise en pause du timer :', error);
                socket.emit('error', 'Erreur lors de la mise en pause du timer.');
            }
        });

        // Recevoir la reprise du timer
        socket.on('resumeMatchTimer', async (data) => {
            const { matchId, startTime } = data;

            const game = await Game.findByPk(matchId);
            if (!game) {
                return socket.emit('error', 'Le match spécifié n\'existe pas.');
            }

            const tourneyId = game.tourneyId;
            const isAuthorized = socket.user.tourneyRoles.some(
                (tr) =>
                    tr.tourneyId === tourneyId &&
                    (tr.role === 'admin' || tr.role === 'assistant')
            );

            if (!isAuthorized) {
                return socket.emit('error', 'Vous n\'êtes pas autorisé à reprendre le timer du match.');
            }

            try {
                // Diffuser l'événement de reprise du timer avec la nouvelle `realStartTime`
                io.to(`game_${matchId}`).emit('resumeMatchTimer', {
                    matchId,
                    startTime,
                });
            } catch (error) {
                console.error('Erreur lors de la reprise du timer :', error);
                socket.emit('error', 'Erreur lors de la reprise du timer.');
            }
        });

        // Recevoir la réinitialisation du timer
        socket.on('resetMatchTimer', async (data) => {
            const { matchId } = data;

            const game = await Game.findByPk(matchId);
            if (!game) {
                return socket.emit('error', 'Le match spécifié n\'existe pas.');
            }

            const tourneyId = game.tourneyId;
            const isAuthorized = socket.user.tourneyRoles.some(
                (tr) =>
                    tr.tourneyId === tourneyId &&
                    (tr.role === 'admin' || tr.role === 'assistant')
            );

            if (!isAuthorized) {
                return socket.emit('error', 'Vous n\'êtes pas autorisé à réinitialiser le timer du match.');
            }

            try {
                // Réinitialiser `realStartTime` dans la base de données
                game.realStartTime = null;
                await game.save();

                // Diffuser l'événement de réinitialisation du timer
                io.to(`game_${matchId}`).emit('resetMatchTimer', { matchId });
            } catch (error) {
                console.error('Erreur lors de la réinitialisation du timer :', error);
                socket.emit('error', 'Erreur lors de la réinitialisation du timer.');
            }
        });


        // Recevoir le démarrage du timer
        socket.on('startMatchTimer', async (data) => {
            const { matchId, startTime } = data;

            // Vérifier si l'utilisateur est autorisé (assistant ou admin du tournoi)
            const game = await Game.findByPk(matchId);
            if (!game) {
                return socket.emit('error', 'Le match spécifié n\'existe pas.');
            }

            const tourneyId = game.tourneyId; // Supposant que Game a un champ tourneyId
            const isAuthorized = socket.user.tourneyRoles.some(
                (tr) =>
                    tr.tourneyId === tourneyId &&
                    (tr.role === 'admin' || tr.role === 'assistant')
            );

            if (!isAuthorized) {
                return socket.emit('error', 'Vous n\'êtes pas autorisé à démarrer le timer du match.');
            }

            try {
                // Mettre à jour l'heure de début réelle du match et le statut
                game.realStartTime = new Date(startTime);
                await game.save();

                // Diffuser le démarrage du timer à tous les clients de la salle
                io.to(`game_${matchId}`).emit('startMatchTimer', {
                    matchId,
                    startTime: game.realStartTime,
                });
            } catch (error) {
                console.error('Erreur lors du démarrage du timer :', error);
                socket.emit('error', 'Erreur lors du démarrage du timer.');
            }

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

        // Recevoir les mises à jour du statut du match
        socket.on('updateMatchStatus', async (data) => {
            const { matchId, status } = data;

            // Vérifier si l'utilisateur est autorisé (assistant ou admin du tournoi)
            const game = await Game.findByPk(matchId);
            if (!game) {
                return socket.emit('error', 'Le match spécifié n\'existe pas.');
            }

            const tourneyId = game.tourneyId;
            const isAuthorized = socket.user.tourneyRoles.some(
                (tr) =>
                    tr.tourneyId === tourneyId &&
                    (tr.role === 'admin' || tr.role === 'assistant')
            );

            if (!isAuthorized) {
                return socket.emit('error', 'Vous n\'êtes pas autorisé à mettre à jour le statut du match.');
            }

            try {
                // Mettre à jour le statut du match
                game.status = status;
                await game.save();

                // Diffuser la mise à jour du statut aux autres clients
                io.to(`game_${matchId}`).emit('matchStatusUpdated', {
                    matchId,
                    status,
                });
            } catch (error) {
                console.error('Erreur lors de la mise à jour du statut du match :', error);
                socket.emit('error', 'Erreur lors de la mise à jour du statut du match.');
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
