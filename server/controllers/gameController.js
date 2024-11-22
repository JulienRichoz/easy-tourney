// server/controllers/gameController.js
const {
  Game,
  Team,
  Field,
  Tourney,
  Sport,
  UsersTourneys,
  User,
} = require('../models');
const { Op } = require('sequelize');
const tourneyTypes = require('../config/tourneyTypes');


/**
 * Créer un nouveau match
 */
exports.createGame = async (req, res) => {
  try {
    const { tourneyId } = req.params;
    const {
      poolScheduleId,
      teamAId,
      teamBId,
      fieldId,
      sportId,
      startTime,
      endTime,
      assistantId,
    } = req.body;

    if (!teamAId || !teamBId || !fieldId || !startTime || !endTime) {
      return res
        .status(400)
        .json({
          message:
            'Les champs \'teamAId\', \'teamBId\', \'fieldId\', \'startTime\', et \'endTime\' sont requis.',
        });
    }

    // Vérifier si le tournoi, les équipes et le terrain existent
    const tourney = await Tourney.findByPk(tourneyId);
    const teamA = await Team.findByPk(teamAId);
    const teamB = await Team.findByPk(teamBId);
    const field = await Field.findByPk(fieldId);

    if (!tourney || !teamA || !teamB || !field) {
      return res
        .status(404)
        .json({ message: 'Tournoi, équipes ou terrain non trouvés.' });
    }

    // Vérifier si les équipes sont de type "player"
    if (teamA.type !== 'player' || teamB.type !== 'player') {
      return res
        .status(400)
        .json({ message: 'Les équipes doivent être de type "player".' });
    }

    const tourneyType = tourneyTypes[tourney.tourneyType];
    // Si le tournoi utilise des pools (certains types de tournoi nécessitent des pools alors que d'autres non)
    if (tourneyType && tourneyType.requiresPool) {
      if (!poolScheduleId) {
        return res
          .status(400)
          .json({ message: "'poolScheduleId' est requis pour ce type de tournoi." });
      }

      const poolSchedule = await PoolSchedule.findByPk(poolScheduleId);
      if (!poolSchedule) {
        return res
          .status(404)
          .json({ message: 'PoolSchedule non trouvée.' });
      }

      const teams = await Team.findAll({
        where: { id: [teamAId, teamBId], poolId: poolSchedule.poolId },
      });
      if (teams.length !== 2) {
        return res
          .status(400)
          .json({ message: 'Les équipes doivent appartenir à la même Pool.' });
      }
    } else {
      // Pour les tournois sans poolss à configurer par la suite
      console.log('Tournoi sans pool');
    }

    // Créer le match
    const game = await Game.create({
      tourneyId,
      poolId: poolScheduleId ? poolSchedule.poolId : null,
      poolScheduleId: poolScheduleId || null,
      teamAId,
      teamBId,
      fieldId,
      sportId,
      startTime,
      endTime,
      assistantId,
      status: 'scheduled',
    });

    res.status(201).json(game);
  } catch (error) {
    console.error('Erreur lors de la création du match :', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

/**
 * Récupérer tous les matchs d'un tournoi
 */
exports.getGamesByTourney = async (req, res) => {
  try {
    const { tourneyId } = req.params;

    const games = await Game.findAll({
      where: { tourneyId },
      include: [
        { model: Team, as: 'teamA', attributes: ['id', 'teamName'] },
        { model: Team, as: 'teamB', attributes: ['id', 'teamName'] },
        { model: Field, as: 'field', attributes: ['id', 'name'] },
        { model: Sport, as: 'sport', attributes: ['id', 'name'] },
        {
          model: UsersTourneys,
          as: 'assistant',
          attributes: ['userId', 'tourneyRole'], // Ajoutez les champs nécessaires
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email'],
              required: false,
            },
          ],
        },
      ],
      logging: console.log,
    });

    res.status(200).json(games);
  } catch (error) {
    console.error('Erreur lors de la récupération des matchs :', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

/**
 * Récupérer un match par ID
 */
exports.getGameById = async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findByPk(gameId, {
      include: [
        { model: Team, as: 'teamA', attributes: ['id', 'teamName'] },
        { model: Team, as: 'teamB', attributes: ['id', 'teamName'] },
        { model: Field, as: 'field', attributes: ['id', 'name'] },
        { model: Sport, as: 'sport', attributes: ['id', 'name'] },
        {
          model: UsersTourneys,
          as: 'assistant',
          attributes: ['id', 'tourneyRole'],
        },
      ],
    });

    if (!game) {
      return res.status(404).json({ message: 'Match non trouvé.' });
    }

    res.status(200).json(game);
  } catch (error) {
    console.error('Erreur lors de la récupération du match :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};

/**
 * Mettre à jour un match
 */
exports.updateGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const updates = req.body;

    const game = await Game.findByPk(gameId);

    if (!game) {
      return res.status(404).json({ message: 'Match non trouvé.' });
    }

    await game.update(updates);
    res.status(200).json(game);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du match :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};

/**
 * Supprimer un match
 */
exports.deleteGame = async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findByPk(gameId);

    if (!game) {
      return res.status(404).json({ message: 'Match non trouvé.' });
    }

    await game.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Erreur lors de la suppression du match :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};

/**
 * Valider les contraintes des matchs
 */
exports.validateGames = async (req, res) => {
  try {
    const { tourneyId } = req.params;

    const games = await Game.findAll({ where: { tourneyId } });

    // Exemple de validation : deux matchs ne doivent pas avoir lieu en même temps sur le même terrain
    const conflicts = [];
    for (let i = 0; i < games.length; i++) {
      for (let j = i + 1; j < games.length; j++) {
        if (
          games[i].fieldId === games[j].fieldId &&
          games[i].startTime < games[j].endTime &&
          games[i].endTime > games[j].startTime
        ) {
          conflicts.push({ game1: games[i], game2: games[j] });
        }
      }
    }

    if (conflicts.length > 0) {
      return res.status(400).json({ message: 'Conflits détectés.', conflicts });
    }

    res.status(200).json({ message: 'Aucun conflit détecté.' });
  } catch (error) {
    console.error('Erreur lors de la validation des matchs :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};
