// server/socketHandlers/gameSockets.js
const { Game, GameEvent, UsersTourneys, User, Tourney } = require('../models');
const { roles } = require('../config/roles');


// fonction utilitaire pour vérifier si l'utilisateur est admin global
function isGlobalAdmin(user) {
    console.log("roles.ADMIN", roles.ADMIN);
    return user && user.roleId === roles.ADMIN;
}

// utils function isAuthorized
async function isAuthorized(socket, tourneyId) {
    const isAdminGlobal = isGlobalAdmin(socket.user);
    const isAssistant = socket.user.tourneyRoles.some(
        (tr) => tr.tourneyId === tourneyId && tr.role === 'assistant'
    );

    // Si assistant et tournoi inactif, ne pas autoriser
    const tourney = await Tourney.findByPk(tourneyId);
    const isTournamentActive = tourney && tourney.status === 'active';
    if (!isTournamentActive && isAssistant) {
        return false;
    }

    return isAdminGlobal || isAssistant;
}


module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('Nouvelle connexion WebSocket :', socket.id);

        // Rejoindre une salle spécifique pour un match
        socket.on('joinGame', async (gameId) => {
            socket.join(`game_${gameId}`);
            console.warn(`Socket ${socket.id} a rejoint la salle game_${gameId}`);

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
            console.warn(`Socket ${socket.id} a quitté la salle game_${gameId}`);

            // Obtenir le nombre de spectateurs restant dans la salle
            const room = io.sockets.adapter.rooms.get(`game_${gameId}`);
            const spectatorCount = room ? room.size : 0;

            // Émettre le nombre de spectateurs mis à jour
            io.to(`game_${gameId}`).emit('spectatorCount', {
                count: spectatorCount,
            });
        });

        // Fonction pour assigner l'assistant
        const assignAssistant = async (game, userId, user) => {
            // Si l'utilisateur est admin global, ne pas exiger UsersTourneys
            if (isGlobalAdmin(user)) {
                // Pas d'affectation d'assistant car admin global n'est pas lié à un seul tournoi
                // Retourner éventuellement un objet assistant fictif
                return { id: user.id, name: user.name };
            }

            // Sinon logique actuelle
            const usersTourney = await UsersTourneys.findOne({
                where: { userId: userId, tourneyId: game.tourneyId },
            });

            if (!usersTourney) {
                throw new Error('Utilisateur non associé au tournoi.');
            }

            game.assistantId = usersTourney.id;
            await game.save();

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
            if (!await isAuthorized(socket, tourneyId)) {
                return socket.emit('error', 'Vous n\'êtes pas autorisé à démarrer ou reprendre le timer du match.');
            }

            try {
                // Assigner l'assistant
                const assistant = await assignAssistant(game, socket.user.id, socket.user);

                if (game.isPaused) {
                    if (game.pausedAt) {
                        const now = new Date();
                        const pauseDuration = now - game.pausedAt; // Durée en millisecondes
                        game.totalPausedTime += pauseDuration;
                    }
                    game.pausedAt = null;
                    game.isPaused = false;
                } else if (!game.realStartTime) {
                    // Démarrage initial du match
                    game.realStartTime = new Date();
                    game.totalPausedTime = 0;
                    game.pausedAt = null;
                    game.isPaused = false;
                } else {
                    // Timer déjà en cours, ne rien faire
                    console.warn(`startMatchTimer appelé alors que le timer est déjà en cours pour matchId=${matchId}`);
                    return;
                }

                await game.save();

                // Diffuser l'événement 'startMatchTimer'
                io.to(`game_${matchId}`).emit('startMatchTimer', {
                    matchId,
                    realStartTime: game.realStartTime,
                    totalPausedTime: game.totalPausedTime,
                    isPaused: game.isPaused,
                    pausedAt: game.pausedAt,
                    assistant: assistant ? assistant.name : null,
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
                include: [
                    {
                        model: UsersTourneys,
                        as: 'assistant',
                        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
                    },
                ],
            });
            if (!game) {
                return socket.emit('error', 'Le match spécifié n\'existe pas.');
            }

            const tourneyId = game.tourneyId;
            if (!isAuthorized(socket, tourneyId)) {
                return socket.emit('error', 'Vous n\'êtes pas autorisé à mettre en pause le timer du match.');
            }

            try {
                // Assigner l'assistant à l'utilisateur actuel
                const assistant = await assignAssistant(game, socket.user.id, socket.user);

                if (!game.isPaused) {
                    game.pausedAt = new Date();
                    game.isPaused = true;
                } else {
                    console.warn(`pauseMatchTimer: Timer already paused for matchId=${matchId}`);
                }

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
            if (!isAuthorized(socket, tourneyId)) {
                return socket.emit('error', 'Vous n\'êtes pas autorisé à réinitialiser le timer du match.');
            }

            try {
                // Assigner l'assistant à l'utilisateur actuel
                const assistant = await assignAssistant(game, socket.user.id, socket.user);

                // Réinitialiser les champs du timer
                game.realStartTime = null;
                game.realEndTime = null;
                game.totalPausedTime = 0;
                game.pausedAt = null;
                game.isPaused = false;
                // **Réinitialiser les scores**
                game.scoreTeamA = 0;
                game.scoreTeamB = 0;
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
            if (!isAuthorized(socket, tourneyId)) {
                return socket.emit('error', 'Vous n\'êtes pas autorisé à arrêter le timer du match.');
            }

            try {
                // Assigner l'assistant à l'utilisateur actuel
                const assistant = await assignAssistant(game, socket.user.id, socket.user);

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
            if (!isAuthorized(socket, tourneyId)) {
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

            const game = await Game.findByPk(matchId);
            if (!game) {
                return socket.emit('error', 'Le match spécifié n\'existe pas.');
            }

            const tourneyId = game.tourneyId;
            if (!await isAuthorized(socket, tourneyId)) {
                return socket.emit('error', 'Vous n\'êtes pas autorisé à mettre à jour le statut du match.');
            }

            if (game.status === 'in_progress' && status === 'completed') {
                // Arrêter le timer en définissant l'heure de fin réelle
                game.realEndTime = new Date();

                // Ne pas modifier isPaused ou pausedAt
            } else if (game.status === 'completed' && status === 'in_progress') {
                // Reprendre le timer en réinitialisant realEndTime
                game.realEndTime = null;
                // Ne pas modifier isPaused ou pausedAt
            }

            try {
                // Mettre à jour le statut du match
                game.status = status;
                await game.save();

                if (game.status === 'in_progress' && !game.realStartTime) {
                    // On initialise le timer si le statut passe de scheduled à in_progress pour la première fois
                    game.realStartTime = new Date();
                    game.totalPausedTime = 0;
                    game.pausedAt = null;
                    game.isPaused = false;
                    await game.save();

                    // On émet l'événement startMatchTimer pour que le frontend soit synchronisé
                    io.to(`game_${matchId}`).emit('startMatchTimer', {
                        matchId,
                        realStartTime: game.realStartTime,
                        totalPausedTime: game.totalPausedTime,
                        isPaused: game.isPaused,
                        pausedAt: game.pausedAt,
                        assistant: game.assistant ? game.assistant.user.name : null,
                    });
                }

                // Diffuser la mise à jour du statut aux clients
                io.to(`game_${matchId}`).emit('matchStatusUpdated', {
                    matchId,
                    status,
                    isPaused: game.isPaused,
                    pausedAt: game.pausedAt ? game.pausedAt.toISOString() : null,
                    totalPausedTime: game.totalPausedTime
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
            if (!isAuthorized(socket, tourneyId)) {
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

        // Recevoir la suppression de tous les événements
        socket.on('deleteAllGameEvents', async (data) => {
            const { tourneyId, gameId } = data;

            try {
                // Supprimer tous les événements dans la base de données
                await GameEvent.destroy({
                    where: { gameId },
                });

                // Informer tous les clients dans la salle
                io.to(`game_${gameId}`).emit('deleteAllGameEvents', {
                    tourneyId,
                    gameId, // Assurez-vous que 'gameId' est inclus
                });
            } catch (error) {
                console.error('Erreur lors de la suppression de tous les événements :', error);
                socket.emit('error', 'Erreur lors de la suppression de tous les événements.');
            }
        });
        socket.on('disconnect', () => {
            console.log('Un utilisateur est déconnecté :', socket.id);
        });
    });
};
