// server/controllers/planningController.js

const {
  Tourney,
  Field,
  SportsFields,
  Sport,
  ScheduleTourney,
  Team,
  Pool,
  PoolSchedule,
  Game,
} = require('../models');

const PlanningStrategyManager = require('../services/planningStrategies/pool/planningStrategyManager');
const GameStrategyManager = require('../services/planningStrategies/game/gameStrategyManager');

const {
  timeDifferenceInMinutes,
} = require('../utils/dateUtils');

exports.getPlanningDetails = async (req, res) => {
  try {
    const { tourneyId } = req.params;

    // Récupérer les informations des terrains (inchangé)
    const fields = await Field.findAll({
      where: { tourneyId },
      include: {
        model: SportsFields,
        as: 'sportsFields',
        include: {
          model: Sport,
          as: 'sport',
          attributes: ['id', 'name', 'color'],
        },
      },
    });

    // Extraire une liste unique des sports depuis les terrains
    const sports = [];
    fields.forEach((field) => {
      field.sportsFields.forEach((sportsField) => {
        if (!sports.find((sport) => sport.id === sportsField.sport.id)) {
          sports.push(sportsField.sport); // Ajouter uniquement les sports uniques
        }
      });
    });

    // Récupérer les pools avec leurs équipes et leurs schedules
    const pools = await Pool.findAll({
      where: { tourneyId },
      include: [
        {
          model: Team,
          as: 'teams',
          attributes: ['id', 'teamName'],
        },
        {
          model: PoolSchedule,
          as: 'schedules',
          include: [
            {
              model: Field,
              as: 'field',
              attributes: ['id', 'name', 'description'],
            },
            {
              model: Sport,
              as: 'sport',
              attributes: ['id', 'name', 'color'],
            },
          ],
          attributes: [
            'id',
            'fieldId',
            'startTime',
            'endTime',
            'date',
            'sportId',
            'poolId',
          ],
        },
      ],
    });

    // Récupérer les matchs planifiés avec toutes les associations nécessaires
    const games = await Game.findAll({
      where: { tourneyId },
      include: [
        { model: Team, as: 'teamA', attributes: ['id', 'teamName'] },
        { model: Team, as: 'teamB', attributes: ['id', 'teamName'] },
        { model: Field, as: 'field', attributes: ['id', 'name', 'description'] },
        { model: Sport, as: 'sport', attributes: ['id', 'name', 'color'] },
        { model: Pool, as: 'pool', attributes: ['id', 'name'] },
        { model: PoolSchedule, as: 'poolSchedule', attributes: ['id', 'startTime', 'endTime', 'date'] },
      ],
      attributes: ['id', 'startTime', 'endTime', 'status', 'poolScheduleId'],
    });

    // Récupérer la configuration du planning
    const scheduleTourney = await ScheduleTourney.findOne({
      where: { tourneyId },
    });

    res.status(200).json({
      fields,
      pools,
      games,
      scheduleTourney,
      sports,
    });
  } catch (error) {
    console.error(
      'Erreur lors de la récupération du planning complet :',
      error
    );
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};

exports.generatePoolPlanning = async (req, res) => {
  const tourneyId = req.params.tourneyId;
  const { randomMode } = req.query; // Extraction du paramaetre ?randomMode=bool

  try {
    // Vérifier si le tournoi existe
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    // Utiliser le tourneyType pour déterminer la stratégie
    const strategy = tourney.tourneyType;

    const planningStrategyManager = new PlanningStrategyManager(
      tourneyId,
      strategy,
      { randomMode: randomMode === 'true' }
    );
    await planningStrategyManager.generatePlanning();

    res.status(200).json({ message: 'Planning généré avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la génération du planning :', error);
    res.status(500).json({ message: error.message });
  }
};

exports.validatePoolPlanning = async (req, res) => {
  const tourneyId = req.params.tourneyId;

  try {
    // Vérifier si le tournoi existe
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    // Utiliser le tourneyType pour déterminer la stratégie
    const strategy = tourney.tourneyType;

    const planningStrategyManager = new PlanningStrategyManager(
      tourneyId,
      strategy
    );

    // Appeler la méthode de validation
    const validationResults = await planningStrategyManager.validatePlanning();

    res.status(200).json({
      message: 'Validation du planning effectuée avec succès.',
      validation: validationResults,
    });
  } catch (error) {
    console.error('Erreur lors de la validation du planning :', error);
    res.status(500).json({ message: error.message });
  }
};

exports.resetPoolPlanning = async (req, res) => {
  try {
    const { tourneyId } = req.params;

    // Vérifier si le tournoi existe
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    // Récupérer les IDs des Pools associés au tournoi
    const pools = await Pool.findAll({
      where: { tourneyId },
      attributes: ['id'],
    });
    const poolIds = pools.map((pool) => pool.id);

    // Supprimer les PoolSchedules associés
    await PoolSchedule.destroy({
      where: {
        poolId: poolIds,
      },
    });

    res
      .status(200)
      .json({ message: 'Plannings des Pools réinitialisés avec succès.' });
  } catch (error) {
    console.error(
      'Erreur lors de la réinitialisation des PoolSchedules :',
      error
    );
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};

/**
 * GESTION DES GAMES (MATCHS)
 */
exports.generateGamePlanning = async (req, res) => {
  try {
    const { tourneyId } = req.params;

    // Récupérer le type de tournoi
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    const strategyManager = new GameStrategyManager(tourneyId, tourney.tourneyType);
    const result = await strategyManager.generateGames();

    res.status(200).json(result);
  } catch (error) {
    console.error('Erreur lors de la génération des matchs :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};

exports.validateGamePlanning = async (req, res) => {
  try {
    const { tourneyId } = req.params;

    // Récupérer le tournoi
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    // Utiliser le tourneyType pour déterminer la stratégie
    const strategyManager = new GameStrategyManager(tourneyId, tourney.tourneyType);

    // Appeler la méthode de validation
    const validationResults = await strategyManager.validateGames();

    res.status(200).json({
      message: 'Validation des matchs effectuée avec succès.',
      validation: validationResults,
    });
  } catch (error) {
    console.error('Erreur lors de la validation des matchs :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};

exports.resetGamePlanning = async (req, res) => {
  try {
    const { tourneyId } = req.params;

    // Supprimer tous les matchs du tournoi
    await Game.destroy({ where: { tourneyId } });

    res.status(200).json({ message: 'Tous les matchs ont été supprimés.' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation des matchs :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};

// server/controllers/planningController.js

exports.getPlanningAdvice = async (req, res) => {
  try {
    const { tourneyId } = req.params;

    // Récupérer le tournoi
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    // Récupérer la configuration du planning
    const scheduleTourney = await ScheduleTourney.findOne({
      where: { tourneyId },
    });
    if (!scheduleTourney) {
      return res.status(404).json({ message: 'Configuration du planning non trouvée.' });
    }

    // Récupérer les pools avec leurs équipes et leurs plannings
    const pools = await Pool.findAll({
      where: { tourneyId },
      include: [
        {
          model: Team,
          as: 'teams',
          attributes: ['id'],
        },
        {
          model: PoolSchedule,
          as: 'schedules',
          attributes: ['startTime', 'endTime'],
        },
      ],
    });

    const advice = [];

    for (const pool of pools) {
      const numTeams = pool.teams.length;
      const numMatchesNeeded = (numTeams * (numTeams - 1)) / 2;

      let totalAvailableTime = 0;
      for (const schedule of pool.schedules) {
        const slotDuration = timeDifferenceInMinutes(
          schedule.startTime,
          schedule.endTime
        );
        totalAvailableTime += slotDuration;
      }

      const matchDuration = scheduleTourney.gameDuration;
      const transitionTime = scheduleTourney.transitionGameTime;
      const totalMatchTime = matchDuration + transitionTime;

      const numMatchesPossible = Math.floor(totalAvailableTime / totalMatchTime);

      if (numMatchesPossible < numMatchesNeeded) {
        advice.push({
          pool: pool.name,
          message: `Le nombre de matchs possibles (${numMatchesPossible}) est insuffisant pour que chaque équipe joue contre toutes les autres (${numMatchesNeeded}).`,
          suggestions: [
            'Réduire la durée des matchs ou le temps de transition.',
            'Augmenter la durée des créneaux horaires.',
            'Réduire le nombre d\'équipes dans la pool.',
          ],
        });
      } else {
        advice.push({
          pool: pool.name,
          message: 'La configuration actuelle permet à chaque équipe de jouer contre toutes les autres.',
        });
      }
    }

    res.status(200).json({ advice });
  } catch (error) {
    console.error('Erreur lors de la génération des conseils :', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};