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
const { Op } = require('sequelize');

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
      let game;
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

        // **Vérification des conflits d'équipes**
        // Vérifier si teamA ou teamB est déjà engagée dans un autre match au même créneau horaire
        const overlappingGamesA = await Game.findOne({
          where: {
            tourneyId,
            [Op.or]: [
              { teamAId: teamAId },
              { teamBId: teamAId },
            ],
            startTime: { [Op.lt]: endTime },
            endTime: { [Op.gt]: startTime },
          },
        });

        if (overlappingGamesA) {
          return res.status(400).json({
            message: `L'équipe A (${teamA.teamName}) est déjà engagée dans un autre match pendant ce créneau horaire.`,
          });
        }

        const overlappingGamesB = await Game.findOne({
          where: {
            tourneyId,
            [Op.or]: [
              { teamAId: teamBId },
              { teamBId: teamBId },
            ],
            startTime: { [Op.lt]: endTime },
            endTime: { [Op.gt]: startTime },
          },
        });

        if (overlappingGamesB) {
          return res.status(400).json({
            message: `L'équipe B (${teamB.teamName}) est déjà engagée dans un autre match pendant ce créneau horaire.`,
          });
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

        // **Vérification des conflits d'équipes**
        // Vérifier si teamA ou teamB est déjà engagée dans un autre match au même créneau horaire
        const overlappingGamesA = await Game.findOne({
          where: {
            tourneyId,
            [Op.or]: [
              { teamAId: teamAId },
              { teamBId: teamAId },
            ],
            startTime: { [Op.lt]: endTime },
            endTime: { [Op.gt]: startTime },
          },
        });

        if (overlappingGamesA) {
          return res.status(400).json({
            message: `L'équipe A (${teamA.teamName}) est déjà engagée dans un autre match pendant ce créneau horaire.`,
          });
        }

        const overlappingGamesB = await Game.findOne({
          where: {
            tourneyId,
            [Op.or]: [
              { teamAId: teamBId },
              { teamBId: teamBId },
            ],
            startTime: { [Op.lt]: endTime },
            endTime: { [Op.gt]: startTime },
          },
        });

        if (overlappingGamesB) {
          return res.status(400).json({
            message: `L'équipe B (${teamB.teamName}) est déjà engagée dans un autre match pendant ce créneau horaire.`,
          });
        }

        // Créer le match sans 'poolId' et 'poolScheduleId'
        game = await Game.create({
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

        // Fetch the new game with associations
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

      // **Vérification des conflits d'équipes**
      // Vérifier si teamA ou teamB est déjà engagée dans un autre match au même créneau horaire
      const overlappingGamesA = await Game.findOne({
        where: {
          tourneyId,
          [Op.or]: [
            { teamAId: teamAId },
            { teamBId: teamAId },
          ],
          startTime: { [Op.lt]: endTime },
          endTime: { [Op.gt]: startTime },
        },
      });

      if (overlappingGamesA) {
        return res.status(400).json({
          message: `L'équipe A (${teamA.teamName}) est déjà engagée dans un autre match pendant ce créneau horaire.`,
        });
      }

      const overlappingGamesB = await Game.findOne({
        where: {
          tourneyId,
          [Op.or]: [
            { teamAId: teamBId },
            { teamBId: teamBId },
          ],
          startTime: { [Op.lt]: endTime },
          endTime: { [Op.gt]: startTime },
        },
      });

      if (overlappingGamesB) {
        return res.status(400).json({
          message: `L'équipe B (${teamB.teamName}) est déjà engagée dans un autre match pendant ce créneau horaire.`,
        });
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
    const tourneyId = req.params.tourneyId;

    const game = await Game.findByPk(gameId, {
      attributes: {
        include: ['realStartTime', 'totalPausedTime', 'pausedAt', 'isPaused'],
      }, include: [
        {
          model: Team,
          as: 'teamA',
          attributes: ['id', 'teamName'],
          include: [
            {
              model: User,
              as: 'players',
              attributes: ['id', 'name'],
              through: {
                attributes: ['tourneyRole'],
                where: { tourneyId: tourneyId },
              },
            },
          ],
        },
        {
          model: Team,
          as: 'teamB',
          attributes: ['id', 'teamName'],
          include: [
            {
              model: User,
              as: 'players',
              attributes: ['id', 'name'],
              through: {
                attributes: ['tourneyRole'],
                where: { tourneyId: tourneyId },
              },
            },
          ],
        },
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

    // Si poolScheduleId est mis à jour, verifier les conflits
    if ('poolScheduleId' in updates) {
      const newPoolScheduleId = updates.poolScheduleId;

      if (newPoolScheduleId) {
        const newPoolSchedule = await PoolSchedule.findByPk(newPoolScheduleId);
        if (!newPoolSchedule) {
          return res.status(404).json({ message: 'PoolSchedule non trouvée.' });
        }

        if (game.poolId && newPoolSchedule.poolId !== game.poolId) {
          return res.status(400).json({
            message: 'Vous ne pouvez déplacer le match que dans la même Pool ou hors Pool.',
          });
        }

        // Check if sports match
        if (game.sportId !== newPoolSchedule.sportId) {
          return res.status(400).json({
            message: 'Vous ne pouvez pas déplacer le match vers un PoolSchedule avec un sport différent.',
          });
        }
      } /*else {
        // UI Experience: A remettre si on veut vraiment bloquer tout ajout en dehors des Pools
        // Si poolScheduleId est mis à null, s'assurer que le tournoi permet des matchs sans Pool
        const tourney = await Tourney.findByPk(game.tourneyId);
        const tourneyType = tourneyTypes[tourney.tourneyType];

        if (tourneyType && tourneyType.requiresPool) {
          return res.status(400).json({
            message: 'Ce tournoi nécessite que les matchs appartiennent à une Pool.',
          });
        }*/
      // }
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
    // Vériofioer les conflits d'équipes
    if ('teamAId' in updates || 'teamBId' in updates || 'startTime' in updates || 'endTime' in updates) {
      const newTeamAId = updates.teamAId || game.teamAId;
      const newTeamBId = updates.teamBId || game.teamBId;
      const newStartTime = updates.startTime || game.startTime;
      const newEndTime = updates.endTime || game.endTime;

      // Vérifier les conflits pour l'équipe A
      const overlappingGamesA = await Game.findOne({
        where: {
          tourneyId: game.tourneyId,
          id: { [Op.ne]: gameId }, // Exclure le match actuel
          [Op.or]: [
            { teamAId: newTeamAId },
            { teamBId: newTeamAId },
          ],
          startTime: { [Op.lt]: newEndTime },
          endTime: { [Op.gt]: newStartTime },
        },
      });

      if (overlappingGamesA) {
        return res.status(400).json({
          message: `L'équipe A (${newTeamAId}) est déjà engagée dans un autre match pendant ce créneau horaire.`,
        });
      }

      // Vérifier les conflits pour l'équipe B
      const overlappingGamesB = await Game.findOne({
        where: {
          tourneyId: game.tourneyId,
          id: { [Op.ne]: gameId }, // Exclure le match actuel
          [Op.or]: [
            { teamAId: newTeamBId },
            { teamBId: newTeamBId },
          ],
          startTime: { [Op.lt]: newEndTime },
          endTime: { [Op.gt]: newStartTime },
        },
      });

      if (overlappingGamesB) {
        return res.status(400).json({
          message: `L'équipe B (${newTeamBId}) est déjà engagée dans un autre match pendant ce créneau horaire.`,
        });
      }
    }

    // Vérifications supplémentaires (équipes, sport, etc.)
    if (updates.teamAId && updates.teamBId && updates.teamAId === updates.teamBId) {
      return res.status(400).json({
        message: "L'équipe A et l'équipe B doivent être différentes.",
      });
    }

    // Mettre à jour le statut et l'assistantId si terminé
    const status = updates.status;
    if (updates.status) {
      game.status = status;
      if (status === 'completed') {
        const userTourney = req.user.tourneyRoles.find(
          (tr) => tr.tourneyId === parseInt(tourneyId)
        );
        game.assistantId = userTourney.id;
      }
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
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Validation échouée.', errors: error.errors });
    }
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
      attributes: ['id', 'fieldId', 'teamAId', 'teamBId', 'startTime', 'endTime'],
      order: [['startTime', 'ASC']],
    });

    const conflicts = [];

    // Vérification des conflits de terrain
    const fieldGamesMap = {};
    games.forEach((game) => {
      const key = game.fieldId;
      if (!fieldGamesMap[key]) {
        fieldGamesMap[key] = [];
      }
      fieldGamesMap[key].push(game);
    });

    for (const fieldId in fieldGamesMap) {
      const fieldGames = fieldGamesMap[fieldId];
      // Trier les matchs par heure de début
      fieldGames.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      for (let i = 0; i < fieldGames.length - 1; i++) {
        const currentGame = fieldGames[i];
        const nextGame = fieldGames[i + 1];

        if (new Date(currentGame.endTime) > new Date(nextGame.startTime)) {
          conflicts.push({
            type: 'Field Conflict',
            fieldId: fieldId,
            game1: currentGame,
            game2: nextGame,
            message: `Conflit de temps sur le terrain ${currentGame.fieldId} entre les matchs ${currentGame.id} et ${nextGame.id}.`,
          });
        }
      }
    }

    // Vérification des conflits d'équipe
    // Créer une carte pour suivre les périodes de jeu pour chaque équipe
    const teamScheduleMap = {};

    games.forEach((game) => {
      const { teamAId, teamBId, startTime, endTime } = game;

      // Fonction pour ajouter un créneau à une équipe
      const addGameToTeam = (teamId) => {
        if (!teamScheduleMap[teamId]) {
          teamScheduleMap[teamId] = [];
        }
        teamScheduleMap[teamId].push({ startTime: new Date(startTime), endTime: new Date(endTime), gameId: game.id });
      };

      addGameToTeam(teamAId);
      addGameToTeam(teamBId);
    });

    // Parcourir chaque équipe et vérifier les chevauchements
    for (const teamId in teamScheduleMap) {
      const teamGames = teamScheduleMap[teamId];
      // Trier les matchs par heure de début
      teamGames.sort((a, b) => a.startTime - b.startTime);

      for (let i = 0; i < teamGames.length - 1; i++) {
        const currentGame = teamGames[i];
        const nextGame = teamGames[i + 1];

        if (currentGame.endTime > nextGame.startTime) {
          // Récupérer les détails des matchs
          const game1 = games.find(g => g.id === currentGame.gameId);
          const game2 = games.find(g => g.id === nextGame.gameId);

          conflicts.push({
            type: 'Team Conflict',
            teamId: teamId,
            game1: game1,
            game2: game2,
            message: `Conflit de planning pour l'équipe ${teamId} entre les matchs ${game1.id} et ${game2.id}.`,
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

/**
 * Récupérer les prochains matchs pour l'utilisateur connecté
 */
exports.getNextGamesForUser = async (req, res) => {
  const { tourneyId } = req.params;
  const userId = req.user.id;

  try {
    // Récupérer l'équipe de l'utilisateur dans le tournoi
    const userTourney = await UsersTourneys.findOne({
      where: { tourneyId, userId },
    });

    if (!userTourney) {
      return res.status(404).json({
        message: "Vous ne participez pas à ce tournoi.",
      });
    }

    if (userTourney.tourneyRole === 'assistant') {
      // Retourner un message spécifique pour les assistants
      return res.status(200).json({
        message: "Vous êtes assistant. Vous devez arbitrer des matchs.",
      });
    }

    if (!userTourney || !userTourney.teamId) {
      return res.status(404).json({
        message:
          "Vous n'êtes pas associé à une équipe pour ce tournoi.",
      });
    }


    const teamId = userTourney.teamId;

    // Récupérer les prochains matchs de l'équipe
    const upcomingGames = await Game.findAll({
      where: {
        tourneyId,
        [Op.or]: [{ teamAId: teamId }, { teamBId: teamId }],
        startTime: {
          [Op.gte]: new Date(), // Matchs à venir
        },
      },
      include: [
        {
          model: Team,
          as: 'teamA',
          attributes: ['id', 'teamName'],
        },
        {
          model: Team,
          as: 'teamB',
          attributes: ['id', 'teamName'],
        },
        {
          model: Pool,
          as: 'pool',
          attributes: ['id', 'name'],
        },
        {
          model: Field,
          as: 'field',
          attributes: ['id', 'name'],
        },
      ],
      order: [['startTime', 'ASC']],
    });

    res.status(200).json(upcomingGames);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des prochains matchs de l'utilisateur :",
      error
    );
    res.status(500).json({
      message:
        'Erreur serveur lors de la récupération des prochains matchs.',
    });
  }
};

/**
 * Récupérer les détails complets d'un match, y compris les joueurs
 */
exports.getGameDetails = async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findByPk(gameId, {
      include: [
        {
          model: Team,
          as: 'teamA',
          attributes: ['id', 'teamName'],
          include: [
            {
              model: User,
              as: 'players',
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          model: Team,
          as: 'teamB',
          attributes: ['id', 'teamName'],
          include: [
            {
              model: User,
              as: 'players',
              attributes: ['id', 'name'],
            },
          ],
        },
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
    console.error('Erreur lors de la récupération des détails du match :', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

exports.completeAllGames = async (req, res) => {
  const { tourneyId } = req.params;

  try {
    // Récupérer tous les matchs pas encore complétés
    const games = await Game.findAll({
      where: {
        tourneyId,
        status: { [Op.in]: ['scheduled', 'in_progress'] }
      }
    });

    const now = new Date();
    for (let game of games) {
      game.status = 'completed';
      // On arrête le timer proprement
      game.realEndTime = now;
      game.isPaused = false;
      game.pausedAt = null;

      await game.save();
    }

    return res.status(200).json({ message: "Tous les matchs ont été mis à 'completed'." });
  } catch (error) {
    console.error("Erreur lors de la mise à jour en masse des matchs :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};
