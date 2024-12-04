// server/socketHandlers/gameSockets.js
const { Game, GameEvent, UsersTourneys, User } = require('../models');
const tourneyRoles = require('../config/tourneyRoles');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('Nouvelle connexion WebSocket :', socket.id);

        // Rejoindre une salle spécifique pour un match
        socket.on('joinGame', async (gameId) => {
            socket.join(`game_${gameId}`);
            console.log(`Socket ${socket.id} a rejoint la salle game_${gameId}`);

            // Obtenir le nombre de spectateurs dans la salle
            const room = io.sockets.adapter.rooms.get(`game_${gameId}`);
            const spectatorCount = room ? room.size : 0;

            // Émettre le nombre de spectateurs
            io.to(`game_${gameId}`).emit('spectatorCount', {
                count: spectatorCount,
            });
        });

        // Quitter la salle du match
        socket.on('leaveGame', (gameId) => {
            socket.leave(`game_${gameId}`);
            console.log(`Socket ${socket.id} a quitté la salle game_${gameId}`);

            // Obtenir le nombre de spectateurs restant dans la salle
            const room = io.sockets.adapter.rooms.get(`game_${gameId}`);
            const spectatorCount = room ? room.size : 0;

            // Émettre le nombre de spectateurs mis à jour
            io.to(`game_${gameId}`).emit('spectatorCount', {
                count: spectatorCount,
            });
        });

        // Fonction pour assigner l'assistant
        const assignAssistant = async (game, userId) => {
            // Trouver l'enregistrement UsersTourneys correspondant
            const usersTourney = await UsersTourneys.findOne({
                where: { userId: userId, tourneyId: game.tourneyId },
            });

            if (!usersTourney) {
                throw new Error('Utilisateur non associé au tournoi.');
            }

            // Assigner assistantId avec UsersTourneys.id
            game.assistantId = usersTourney.id;
            await game.save();

            // Récupérer les détails de l'utilisateur
            const assistant = await User.findByPk(userId, {
                attributes: ['id', 'name'],
            });

            return assistant;
        };

        // Recevoir le démarrage ou la reprise du timer
        socket.on('startMatchTimer', async (data) => {
            const { matchId } = data;

            const game = await Game.findByPk(matchId, {
                include: [{ model: UsersTourneys, as: 'assistant', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] }],
            });
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
                return socket.emit('error', 'Vous n\'êtes pas autorisé à démarrer ou reprendre le timer du match.');
            }

            try {
                // Assigner l'assistant à l'utilisateur actuel
                const assistant = await assignAssistant(game, socket.user.id);

                if (game.isPaused) {
                    if (game.pausedAt) {
                        const now = new Date();
                        const pauseDuration = now - game.pausedAt;
                        game.totalPausedTime += pauseDuration;
                        game.pausedAt = null;
                        game.isPaused = false;
                    }
                } else if (!game.realStartTime) {
                    // Démarrage initial du match
                    game.realStartTime = new Date();
                    game.totalPausedTime = 0;
                    game.pausedAt = null;
                    game.isPaused = false;
                } else {
                    // Le timer est déjà en cours
                    return;
                }

                await game.save();

                // Diffuser le démarrage ou la reprise du timer avec les infos de l'assistant
                io.to(`game_${matchId}`).emit('startMatchTimer', {
                    matchId,
                    realStartTime: game.realStartTime,
                    totalPausedTime: game.totalPausedTime,
                    isPaused: game.isPaused,
                    pausedAt: game.pausedAt,
                    assistant: assistant ? assistant.name : null, // Inclure les informations de l'assistant
                });
            } catch (error) {
                console.error('Erreur lors du démarrage ou de la reprise du timer :', error);
                socket.emit('error', 'Erreur lors du démarrage ou de la reprise du timer.');
            }
        });

        // Recevoir la mise en pause du timer
        socket.on('pauseMatchTimer', async (data) => {
            const { matchId } = data;

            const game = await Game.findByPk(matchId, {
                include: [{ model: UsersTourneys, as: 'assistant', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] }],
            });
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
                // Assigner l'assistant à l'utilisateur actuel
                const assistant = await assignAssistant(game, socket.user.id);

                // Mettre à jour les champs pour la pause
                game.pausedAt = new Date();
                game.isPaused = true;
                await game.save();

                // Diffuser l'événement de pause du timer avec les infos de l'assistant
                io.to(`game_${matchId}`).emit('pauseMatchTimer', {
                    matchId,
                    pausedAt: game.pausedAt,
                    isPaused: game.isPaused,
                    assistant: assistant ? assistant.name : null, // Inclure les informations de l'assistant
                });
            } catch (error) {
                console.error('Erreur lors de la mise en pause du timer :', error);
                socket.emit('error', 'Erreur lors de la mise en pause du timer.');
            }
        });

        // Recevoir la réinitialisation du timer
        socket.on('resetMatchTimer', async (data) => {
            const { matchId } = data;

            const game = await Game.findByPk(matchId, {
                include: [{ model: UsersTourneys, as: 'assistant', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] }],
            });
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
                // Assigner l'assistant à l'utilisateur actuel
                const assistant = await assignAssistant(game, socket.user.id);

                // Réinitialiser les champs du timer
                game.realStartTime = null;
                game.realEndTime = null;
                game.totalPausedTime = 0;
                game.pausedAt = null;
                game.isPaused = false;
                await game.save();

                // Diffuser l'événement de réinitialisation du timer avec les infos de l'assistant
                io.to(`game_${matchId}`).emit('resetMatchTimer', {
                    matchId,
                    assistant: assistant ? assistant.name : null, // Inclure les informations de l'assistant
                });
            } catch (error) {
                console.error('Erreur lors de la réinitialisation du timer :', error);
                socket.emit('error', 'Erreur lors de la réinitialisation du timer.');
            }
        });

        // Recevoir l'arrêt du timer
        socket.on('stopMatchTimer', async (data) => {
            const { matchId } = data;

            const game = await Game.findByPk(matchId, {
                include: [{ model: UsersTourneys, as: 'assistant', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] }],
            });
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
                return socket.emit('error', 'Vous n\'êtes pas autorisé à arrêter le timer du match.');
            }

            try {
                // Assigner l'assistant à l'utilisateur actuel
                const assistant = await assignAssistant(game, socket.user.id);

                // Mettre à jour l'heure de fin réelle du match et les champs du timer
                game.realEndTime = new Date();
                game.isPaused = false;
                game.pausedAt = null;
                await game.save();

                // Diffuser l'arrêt du timer à tous les clients de la salle avec les infos de l'assistant
                io.to(`game_${matchId}`).emit('stopMatchTimer', {
                    matchId,
                    realEndTime: game.realEndTime,
                    isPaused: game.isPaused,
                    assistant: assistant ? assistant.name : null, // Inclure les informations de l'assistant
                });
            } catch (error) {
                console.error("Erreur lors de l'arrêt du timer : ", error);
                socket.emit('error', "Erreur lors de l'arrêt du timer.");
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

            try {
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
            } catch (error) {
                console.error('Erreur lors de l\'enregistrement de l\'événement :', error);
                socket.emit('error', 'Erreur lors de l\'enregistrement de l\'événement.');
            }
        });

        socket.on('disconnect', () => {
            console.log('Un utilisateur est déconnecté :', socket.id);
        });
    });
};
