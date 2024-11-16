// server/controllers/gameEventController.js
const { GameEvent } = require('../models');

/**
 * Créer un événement pour un match
 */
exports.createGameEvent = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { teamId, type, description } = req.body;

    if (!teamId || !type) {
      return res.status(400).json({ message: "Les champs 'teamId' et 'type' sont requis." });
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
exports.getGameEventsByGame = async (req, res) => {
  try {
    const { gameId } = req.params;

    const events = await GameEvent.findAll({
      where: { gameId },
    });

    res.status(200).json(events);
  } catch (error) {
    console.error('Erreur lors de la récupération des événements :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};

/**
 * Mettre à jour un événement
 */
exports.updateGameEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    const event = await GameEvent.findByPk(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé.' });
    }

    await event.update(updates);
    res.status(200).json(event);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
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
