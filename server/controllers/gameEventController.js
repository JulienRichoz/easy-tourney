// server/controllers/gameEventController.js
const { GameEvent, Game, Team } = require('../models');
const socket = require('../socket');

/**
 * Créer un événement pour un match
 */
exports.createGameEvent = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { teamId, type, description } = req.body;

    if (!teamId || !type) {
      return res
        .status(400)
        .json({ message: 'Les champs \'teamId\' et \'type\' sont requis.' });
    }

    const gameEvent = await GameEvent.create({
      gameId,
      teamId,
      type,
      description,
    });

    res.status(201).json(gameEvent);
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};

/**
 * Récupérer les événements d'un match
 */
exports.getGameEvents = async (req, res) => {
  try {
    const { gameId } = req.params;

    const events = await GameEvent.findAll({
      where: { gameId },
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'teamName'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    res.status(200).json(events);
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des événements du match :',
      error
    );
    res
      .status(500)
      .json({ message: 'Erreur serveur.', error: error.message });
  }
};

/**
 * Mettre à jour un événement
 */
exports.updateGameEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { teamId, type, description } = req.body;

    // Validation manuelle
    const allowedTypes = ['goal', 'foul', 'yellow_card', 'red_card'];
    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({ message: 'Type d\'événement invalide.' });
    }

    // Récupérer l'événement avec le match associé
    const event = await GameEvent.findByPk(eventId, {
      include: [{ model: Game, as: 'game' }],
    });

    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé.' });
    }

    // Si teamId est fourni, vérifier qu'il correspond à une des équipes du match
    if (teamId) {
      const game = event.game;
      if (![game.teamAId, game.teamBId].includes(teamId)) {
        return res.status(400).json({ message: 'teamId doit correspondre à une des équipes du match.' });
      }

      // Vérifier que l'équipe existe
      const team = await Team.findByPk(teamId);
      if (!team) {
        return res.status(404).json({ message: 'Équipe non trouvée.' });
      }
    }

    // Préparer les mises à jour
    const updates = {};
    if (teamId !== undefined) updates.teamId = teamId;
    if (type !== undefined) updates.type = type;
    if (description !== undefined) updates.description = description;

    // Mettre à jour l'événement
    await event.update(updates);

    // Émettre un événement via Socket.IO
    const io = socket.getIO();
    io.to(`game_${event.gameId}`).emit('gameEventUpdated', event);

    res.status(200).json(event);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement :', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

/**
 * Supprimer un événement
 */
exports.deleteGameEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await GameEvent.findByPk(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé.' });
    }

    await event.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};
