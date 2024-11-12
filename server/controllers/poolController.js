// server/controllers/poolController.js
const { Tourney, Pool, Team, PoolSchedule } = require('../models');
const { Op } = require('sequelize');
const PoolStrategyManager = require('../services/poolStrategies/poolStrategyManager');

/**
 * Créer une nouvelle pool pour un tournoi
 */
exports.createPool = async (req, res) => {
  try {
    const { tourneyId } = req.params;
    const {
      name,
      maxTeamPerPool,
      minTeamPerPool,
      stage,
      startTime,
      endTime
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Le champ 'name' est requis." });
    }

    // Vérifier si le tournoi existe
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    // Utiliser les valeurs par défaut si les valeurs spécifiques ne sont pas fournies
    const poolMaxTeamPerPool = maxTeamPerPool || tourney.defaultMaxTeamPerPool;
    const poolMinTeamPerPool = minTeamPerPool || tourney.defaultMinTeamPerPool;

    // Créer la pool
    const pool = await Pool.create({
      name,
      tourneyId,
      maxTeamPerPool: poolMaxTeamPerPool,
      minTeamPerPool: poolMinTeamPerPool,
      stage,
      startTime,
      endTime,
    });

    res.status(201).json(pool);
  } catch (error) {
    console.error('Erreur lors de la création de la pool :', error);
    res.status(500).json({ message: 'Erreur lors de la création de la pool.', error });
  }
};



/**
 * Récupérer toutes les pools d'un tournoi
 */
exports.getPoolsByTourney = async (req, res) => {
  try {
    const { tourneyId } = req.params;

    const pools = await Pool.findAll({
      where: { tourneyId },
      include: [
        {
          model: Team,
          as: 'teams',
          attributes: ['id', 'teamName'],
        },
      ],
    });

    res.status(200).json(pools);
  } catch (error) {
    console.error('Erreur lors de la récupération des pools :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des pools.', error });
  }
};

/**
 * Récupérer une pool par son ID
 */
exports.getPoolById = async (req, res) => {
  try {
    const { tourneyId, poolId } = req.params;

    const pool = await Pool.findOne({
      where: { id: poolId, tourneyId },
      include: [
        {
          model: Team,
          as: 'teams',
          attributes: ['id', 'teamName'],
        },
      ],
    });

    if (!pool) {
      return res.status(404).json({ message: 'Pool non trouvée.' });
    }

    res.status(200).json(pool);
  } catch (error) {
    console.error('Erreur lors de la récupération de la pool :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la pool.', error });
  }
};

/**
 * Mettre à jour une pool
 */
exports.updatePool = async (req, res) => {
  try {
    const { poolId } = req.params;
    const { name } = req.body;

    const pool = await Pool.findByPk(poolId);
    if (!pool) {
      return res.status(404).json({ message: 'Pool non trouvée.' });
    }

    await pool.update({ name });

    res.status(200).json(pool);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la pool :', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la pool.', error });
  }
};

/**
 * Supprimer une pool
 */
exports.deletePool = async (req, res) => {
  try {
    const { poolId } = req.params;

    const pool = await Pool.findByPk(poolId);
    if (!pool) {
      return res.status(404).json({ message: 'Pool non trouvée.' });
    }

    await pool.destroy();

    res.status(204).send();
  } catch (error) {
    console.error('Erreur lors de la suppression de la pool :', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la pool.', error });
  }
};

/**
 * Assigner une ou plusieurs équipes à une pool.
 */
exports.assignTeamsToPool = async (req, res) => {
  try {
    const { poolId } = req.params;
    const { teamIds } = req.body; // Array des IDs des équipes à assigner

    if (!teamIds || teamIds.length === 0) {
      return res.status(400).json({ message: "Aucune équipe spécifiée pour l'assignation." });
    }

    const pool = await Pool.findByPk(poolId);
    if (!pool) {
      return res.status(404).json({ message: 'Pool non trouvée.' });
    }

    // Vérifier que les équipes existent et appartiennent au même tournoi que la pool
    const teams = await Team.findAll({
      where: {
        id: {
          [Op.in]: teamIds,
        },
        tourneyId: pool.tourneyId,
      },
    });

    if (teams.length !== teamIds.length) {
      return res.status(400).json({ message: 'Certaines équipes spécifiées sont invalides ou n\'appartiennent pas au même tournoi.' });
    }

    // Filtrer les équipes de type 'assistant'
    const validTeams = teams.filter(team => team.type !== 'assistant');

    if (validTeams.length === 0) {
      return res.status(400).json({ message: 'Toutes les équipes spécifiées sont de type assistant et ne peuvent pas être assignées.' });
    }

    // Vérifier si l'ajout de ces équipes dépasse la capacité maximale de la pool
    const currentTeamsCount = await Team.count({ where: { poolId: pool.id } });
    const totalTeamsAfterAssignment = currentTeamsCount + validTeams.length;

    if (pool.maxTeamPerPool && totalTeamsAfterAssignment > pool.maxTeamPerPool) {
      return res.status(400).json({ message: `Impossible d'assigner les équipes : la pool atteindrait sa capacité maximale de ${pool.maxTeamPerPool} équipes.` });
    }

    // Assigner les équipes valides à la pool
    await Team.update({ poolId }, {
      where: {
        id: {
          [Op.in]: validTeams.map(team => team.id),
        },
      },
    });

    res.status(200).json({ message: 'Équipes assignées à la pool avec succès.' });
  } catch (error) {
    console.error('Erreur lors de l\'assignation des équipes à la pool :', error);
    res.status(500).json({ message: 'Erreur lors de l\'assignation des équipes à la pool.', error });
  }
};

/**
 * Retirer une ou plusieurs équipes d'une pool.
 */
exports.removeTeamsFromPool = async (req, res) => {
  try {
    const { poolId } = req.params;
    const { teamIds } = req.body; // Array des IDs des équipes à retirer

    if (!teamIds || teamIds.length === 0) {
      return res.status(400).json({ message: "Aucune équipe spécifiée pour le retrait." });
    }

    const pool = await Pool.findByPk(poolId);
    if (!pool) {
      return res.status(404).json({ message: 'Pool non trouvée.' });
    }

    // Vérifier quelles équipes parmi teamIds sont réellement assignées à cette pool
    const assignedTeams = await Team.findAll({
      where: {
        id: {
          [Op.in]: teamIds,
        },
        poolId: poolId, // Assurer que les équipes sont bien dans la pool spécifiée
      },
    });

    if (assignedTeams.length === 0) {
      return res.status(400).json({ message: 'Aucune des équipes spécifiées n\'est associée à cette pool.' });
    }

    // Retirer les équipes de la pool
    const assignedTeamIds = assignedTeams.map(team => team.id);
    await Team.update({ poolId: null }, {
      where: {
        id: {
          [Op.in]: assignedTeamIds,
        },
      },
    });

    res.status(200).json({ message: 'Équipes retirées de la pool avec succès.', removedTeamIds: assignedTeamIds });
  } catch (error) {
    console.error('Erreur lors du retrait des équipes de la pool :', error);
    res.status(500).json({ message: 'Erreur lors du retrait des équipes de la pool.', error });
  }
};


/**
 * Assigner automatiquement des équipes aux pools de manière équilibrée.
 */
exports.autoAssignTeamsToPools = async (req, res) => {
  try {
    const { tourneyId } = req.params;

    // Récupérer toutes les équipes non assignées et les pools du tournoi
    const unassignedTeams = await Team.findAll({
      where: {
        tourneyId,
        poolId: null,
        type: 'player', // Exclure les équipes de type 'assistant'
      },
    });

    const pools = await Pool.findAll({
      where: { tourneyId },
      include: [
        {
          model: Team,
          as: 'teams',
          attributes: ['id'],
        },
      ],
    });

    if (pools.length === 0) {
      return res.status(400).json({ message: 'Aucune pool disponible pour l\'assignation.' });
    }

    // Algorithme pour répartir les équipes de manière équilibrée
    let poolIndex = 0;
    for (const team of unassignedTeams) {
      let assigned = false;
      let attempts = 0;

      while (!assigned && attempts < pools.length) {
        const currentPool = pools[poolIndex];
        const teamsInPoolCount = currentPool.teams.length;

        if (!currentPool.maxTeamPerPool || teamsInPoolCount < currentPool.maxTeamPerPool) {
          // Assign the team to the pool
          await team.update({ poolId: currentPool.id });

          // Mettre à jour le tableau des équipes de la pool
          currentPool.teams.push(team);
          assigned = true;
        }

        // Passer à la pool suivante
        poolIndex = (poolIndex + 1) % pools.length;
        attempts++;
      }

      if (!assigned) {
        return res.status(400).json({ message: 'Impossible d\'assigner toutes les équipes : toutes les pools sont pleines.' });
      }
    }

    res.status(200).json({ message: 'Équipes assignées automatiquement aux pools.' });
  } catch (error) {
    console.error('Erreur lors de l\'assignation automatique des équipes :', error);
    res.status(500).json({ message: 'Erreur lors de l\'assignation automatique des équipes.', error });
  }
};

exports.createPoolSchedule = async (req, res) => {
  try {
    const { poolId } = req.params;
    const { fieldId, startTime, endTime, date } = req.body;

    // Vérifier si la Pool existe
    const pool = await Pool.findByPk(poolId);
    if (!pool) {
      return res.status(404).json({ message: 'Pool non trouvée.' });
    }

    // Vérifier si le Field existe
    const field = await Field.findByPk(fieldId);
    if (!field) {
      return res.status(404).json({ message: 'Terrain non trouvé.' });
    }

    // Créer la session de Pool
    const poolSchedule = await PoolSchedule.create({
      poolId,
      fieldId,
      startTime,
      endTime,
      date,
    });

    res.status(201).json(poolSchedule);
  } catch (error) {
    console.error('Erreur lors de la création de la session de Pool :', error);
    res.status(500).json({ message: 'Erreur lors de la création de la session de Pool.', error });
  }
};

exports.getPoolSchedules = async (req, res) => {
  try {
    const { poolId } = req.params;

    const poolSchedules = await PoolSchedule.findAll({
      where: { poolId },
      include: [
        {
          model: Field,
          as: 'field',
          attributes: ['id', 'name'],
        },
      ],
    });

    res.status(200).json(poolSchedules);
  } catch (error) {
    console.error('Erreur lors de la récupération des sessions de Pool :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des sessions de Pool.', error });
  }
};

// Generate Pools depending of the strategy used (tourneyType)
exports.generatePools = async (req, res) => {
  const tourneyId = req.params.tourneyId;
  const { poolCount, strategy } = req.body;

  try {
    // Vérifier si le tournoi existe
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    const poolStrategyManager = new PoolStrategyManager(tourneyId, strategy);
    const pools = await poolStrategyManager.generatePools(poolCount);

    res.status(200).json({ message: 'Pools générés avec succès.', pools });
  } catch (error) {
    console.error('Erreur lors de la génération des pools :', error);
    res.status(500).json({ message: 'Erreur lors de la génération des pools.', error });
  }
};



