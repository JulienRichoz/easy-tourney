// server/controllers/gameController.js
const {
  Game,
  Team,
  Field,
  Tourney,
  Sport,
  UsersTourneys,
  User,
  PoolSchedule,
  Pool,
} = require('../models');

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

    if (!teamAId || !teamBId || !startTime || !endTime) {
      return res.status(400).json({
        message:
          "Les champs 'teamAId', 'teamBId', 'startTime', et 'endTime' sont requis.",
      });
    }

    // Vérifier que le tournoi existe
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    const teamA = await Team.findByPk(teamAId);
    const teamB = await Team.findByPk(teamBId);

    if (!teamA || !teamB) {
      return res
        .status(404)
        .json({ message: 'Une ou plusieurs équipes non trouvées.' });
    }

    // Vérifier si les équipes sont de type "player"
    if (teamA.type !== 'player' || teamB.type !== 'player') {
      return res
        .status(400)
        .json({ message: 'Les équipes doivent être de type "player".' });
    }

    if (teamAId === teamBId) {
      return res.status(400).json({
        message: "L'équipe A et l'équipe B doivent être différentes.",
      });
    }

    const tourneyType = tourneyTypes[tourney.tourneyType];
    let poolId = null;

    // Si le tournoi utilise des pools
    if (tourneyType && tourneyType.requiresPool) {
      // UI Experience: A remettre si on veut vraiment bloquer tout ajout en dehors des
      /* if (!poolScheduleId) {
        return res.status(400).json({
          message: "'poolScheduleId' est requis pour ce type de tournoi.",
        });
      }*/
      if (poolScheduleId) {
        const poolSchedule = await PoolSchedule.findByPk(poolScheduleId);
        if (!poolSchedule) {
          return res
            .status(404)
            .json({ message: 'PoolSchedule non trouvée.' });
        }

        poolId = poolSchedule.poolId;

        // Vérifier que les équipes appartiennent à la même Pool
        if (
          teamA.poolId !== poolId ||
          teamB.poolId !== poolId ||
          teamA.poolId !== teamB.poolId
        ) {
          return res.status(400).json({
            message: 'Les équipes doivent appartenir à la même Pool.',
          });
        }

        // Si 'fieldId' ou 'sportId' ne sont pas fournis, utiliser ceux de la PoolSchedule
        const finalFieldId = fieldId || poolSchedule.fieldId;
        const finalSportId = sportId || poolSchedule.sportId;

        // Vérifier que le terrain existe
        const field = await Field.findByPk(finalFieldId);
        if (!field) {
          return res.status(404).json({ message: 'Terrain non trouvé.' });
        }

        // Vérifier que le sport existe
        const sport = await Sport.findByPk(finalSportId);
        if (!sport) {
          return res.status(404).json({ message: 'Sport non trouvé.' });
        }

        // Créer le match
        const game = await Game.create({
          tourneyId,
          poolId,
          poolScheduleId,
          teamAId,
          teamBId,
          fieldId: finalFieldId,
          sportId: finalSportId,
          startTime,
          endTime,
          assistantId,
          status: 'scheduled',
        });

        const newGame = await Game.findByPk(game.id, {
          include: [
            { model: Team, as: 'teamA', attributes: ['id', 'teamName'] },
            { model: Team, as: 'teamB', attributes: ['id', 'teamName'] },
            { model: Field, as: 'field', attributes: ['id', 'name'] },
            { model: Sport, as: 'sport', attributes: ['id', 'name', 'color'] },
            { model: Pool, as: 'pool', attributes: ['id', 'name'] },
          ],
        });

        res.status(201).json(newGame);
      } else {
        // Permettre la création de matchs sans 'poolScheduleId' pour ce type de tournoi
        // Vérifiez que 'fieldId' et 'sportId' sont fournis
        if (!fieldId || !sportId) {
          return res.status(400).json({
            message: "'fieldId' et 'sportId' sont requis pour ce type de tournoi.",
          });
        }

        // Vérifier que le terrain existe
        const field = await Field.findByPk(fieldId);
        if (!field) {
          return res.status(404).json({ message: 'Terrain non trouvé.' });
        }

        // Vérifier que le sport existe
        const sport = await Sport.findByPk(sportId);
        if (!sport) {
          return res.status(404).json({ message: 'Sport non trouvé.' });
        }

        // Créer le match sans 'poolId' et 'poolScheduleId'
        const game = await Game.create({
          tourneyId,
          poolId: null,
          poolScheduleId: null,
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
      }
    } else {
      // Pour les tournois sans pools

      if (!fieldId || !sportId) {
        return res.status(400).json({
          message:
            "'fieldId' et 'sportId' sont requis pour ce type de tournoi.",
        });
      }

      // Vérifier que le terrain existe
      const field = await Field.findByPk(fieldId);
      if (!field) {
        return res.status(404).json({ message: 'Terrain non trouvé.' });
      }

      // Vérifier que le sport existe
      const sport = await Sport.findByPk(sportId);
      if (!sport) {
        return res.status(404).json({ message: 'Sport non trouvé.' });
      }

      // Créer le match
      const game = await Game.create({
        tourneyId,
        poolId: null,
        poolScheduleId: null,
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
    }
  } catch (error) {
    console.error('Erreur lors de la création du match :', error);
    res
      .status(500)
      .json({ message: 'Erreur serveur.', error: error.message });
  }
};

/**
 * Récupérer tous les matchs d'un tournoi
 */
exports.getGamesByTourney = async (req, res) => {
  try {
    const { tourneyId } = req.params;

    // Vérifier que le tournoi existe
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

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
          attributes: ['userId', 'tourneyRole'],
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
          attributes: ['userId', 'tourneyRole'],
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
    });

    if (!game) {
      return res.status(404).json({ message: 'Match non trouvé.' });
    }

    res.status(200).json(game);
  } catch (error) {
    console.error('Erreur lors de la récupération du match :', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

/**
 * Récupérer les matchs par PoolSchedule
 */
exports.getGamesByPoolSchedule = async (req, res) => {
  try {
    const { tourneyId, poolScheduleId } = req.params;

    // Vérifier que le tournoi existe
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    // Vérifier que la PoolSchedule existe
    const poolSchedule = await PoolSchedule.findByPk(poolScheduleId);
    if (!poolSchedule) {
      return res.status(404).json({ message: 'PoolSchedule non trouvée.' });
    }

    const games = await Game.findAll({
      where: { tourneyId, poolScheduleId },
      include: [
        { model: Team, as: 'teamA', attributes: ['id', 'teamName'] },
        { model: Team, as: 'teamB', attributes: ['id', 'teamName'] },
        { model: Field, as: 'field', attributes: ['id', 'name'] },
        { model: Sport, as: 'sport', attributes: ['id', 'name'] },
        {
          model: UsersTourneys,
          as: 'assistant',
          attributes: ['userId', 'tourneyRole'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
    });

    res.status(200).json(games);
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des matchs pour la PoolSchedule :',
      error
    );
    res
      .status(500)
      .json({ message: 'Erreur serveur.', error: error.message });
  }
};

/**
 * Récupérer les matchs par Pool
 */
exports.getGamesByPool = async (req, res) => {
  try {
    const { tourneyId, poolId } = req.params;

    // Vérifier que le tournoi existe
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    const games = await Game.findAll({
      where: { tourneyId, poolId },
      include: [
        { model: Team, as: 'teamA', attributes: ['id', 'teamName'] },
        { model: Team, as: 'teamB', attributes: ['id', 'teamName'] },
        { model: Field, as: 'field', attributes: ['id', 'name'] },
        { model: Sport, as: 'sport', attributes: ['id', 'name'] },
        {
          model: UsersTourneys,
          as: 'assistant',
          attributes: ['userId', 'tourneyRole'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
    });

    res.status(200).json(games);
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des matchs pour la Pool :',
      error
    );
    res
      .status(500)
      .json({ message: 'Erreur serveur.', error: error.message });
  }
};

/**
 * Mettre à jour un match
 */
exports.updateGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const updates = req.body;

    // Récupérer le match existant avec ses associations Pool et PoolSchedule
    const game = await Game.findByPk(gameId, {
      include: [
        { model: Pool, as: 'pool', attributes: ['id'] },
        { model: PoolSchedule, as: 'poolSchedule', attributes: ['poolId'] },
      ],
    });

    if (!game) {
      return res.status(404).json({ message: 'Match non trouvé.' });
    }

    // Si poolScheduleId est mis à jour
    if ('poolScheduleId' in updates) {
      const newPoolScheduleId = updates.poolScheduleId;

      if (newPoolScheduleId) {
        // Vérifier que le nouveau PoolSchedule existe
        const newPoolSchedule = await PoolSchedule.findByPk(newPoolScheduleId);
        if (!newPoolSchedule) {
          return res.status(404).json({ message: 'PoolSchedule non trouvée.' });
        }

        // Vérifier que le nouveau PoolSchedule appartient à la même Pool
        if (game.poolId && newPoolSchedule.poolId !== game.poolId) {
          return res.status(400).json({
            message: 'Vous ne pouvez déplacer le match que dans la même Pool ou hors Pool.',
          });
        }
      } else {
        // Si poolScheduleId est mis à null, s'assurer que le tournoi permet des matchs sans Pool
        const tourney = await Tourney.findByPk(game.tourneyId);
        const tourneyType = tourneyTypes[tourney.tourneyType];

        if (tourneyType && tourneyType.requiresPool) {
          return res.status(400).json({
            message: 'Ce tournoi nécessite que les matchs appartiennent à une Pool.',
          });
        }
      }
    }

    // Si fieldId est mis à jour, vérifier la cohérence avec la Pool actuelle
    if ('fieldId' in updates) {
      const newFieldId = updates.fieldId;
      if (game.poolId) {
        // Vérifier que le nouveau terrain est associé à la même Pool via PoolSchedule
        const poolSchedule = await PoolSchedule.findOne({
          where: { poolId: game.poolId, fieldId: newFieldId },
        });

        if (!poolSchedule) {
          return res.status(400).json({
            message: 'Le terrain doit appartenir à la même Pool.',
          });
        }

        // Mettre à jour poolScheduleId si nécessaire
        updates.poolScheduleId = poolSchedule.id;
      }
    }

    // Vérifications supplémentaires (équipes, sport, etc.)
    if (updates.teamAId && updates.teamBId && updates.teamAId === updates.teamBId) {
      return res.status(400).json({
        message: "L'équipe A et l'équipe B doivent être différentes.",
      });
    }

    // Mettre à jour les champs du match
    Object.assign(game, updates);

    // Valider les données mises à jour
    await game.validate();

    // Sauvegarder les modifications
    await game.save();

    // Récupérer le match mis à jour avec ses associations
    const updatedGame = await Game.findByPk(gameId, {
      include: [
        { model: Team, as: 'teamA', attributes: ['id', 'teamName'] },
        { model: Team, as: 'teamB', attributes: ['id', 'teamName'] },
        { model: Field, as: 'field', attributes: ['id', 'name'] },
        { model: Sport, as: 'sport', attributes: ['id', 'name', 'color'] },
        { model: Pool, as: 'pool', attributes: ['id', 'name'] },
        { model: PoolSchedule, as: 'poolSchedule', attributes: ['id', 'startTime', 'endTime', 'date', 'poolId'] },
      ],
    });

    res.status(200).json(updatedGame);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du match :', error);
    res
      .status(500)
      .json({ message: 'Erreur serveur.', error: error.message });
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
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

/**
 * Valider les contraintes des matchs
 */
exports.validateGames = async (req, res) => {
  try {
    const { tourneyId } = req.params;

    // Vérifier que le tournoi existe
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    const games = await Game.findAll({
      where: { tourneyId },
      attributes: ['id', 'fieldId', 'startTime', 'endTime'],
      order: [['fieldId'], ['startTime']],
    });

    const conflicts = [];

    for (let i = 0; i < games.length - 1; i++) {
      const currentGame = games[i];
      const nextGame = games[i + 1];

      if (currentGame.fieldId === nextGame.fieldId) {
        if (currentGame.endTime > nextGame.startTime) {
          conflicts.push({
            game1: currentGame,
            game2: nextGame,
          });
        }
      }
    }

    if (conflicts.length > 0) {
      return res.status(400).json({ message: 'Conflits détectés.', conflicts });
    }

    res.status(200).json({ message: 'Aucun conflit détecté.' });
  } catch (error) {
    console.error('Erreur lors de la validation des matchs :', error);
    res
      .status(500)
      .json({ message: 'Erreur serveur.', error: error.message });
  }
};
