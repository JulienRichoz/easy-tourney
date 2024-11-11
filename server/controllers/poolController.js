// server/controllers/poolController.js
const { Pool, Team, TeamSetup } = require('../models');
const { Op } = require('sequelize');

/**
 * Créer une nouvelle pool pour un tournoi
 */
exports.createPool = async (req, res) => {
  try {
    const { tourneyId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Le champ 'name' est requis." });
    }

    // Vérifier si le tournoi existe
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    // Créer la pool
    const pool = await Pool.create({ name, tourneyId });

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

    // Vérifier que les équipes existent et qu'elles appartiennent au même tournoi que la pool
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

    // Assigner les équipes à la pool
    await Team.update({ poolId }, {
      where: {
        id: {
          [Op.in]: teamIds,
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

    // Retirer les équipes de la pool
    await Team.update({ poolId: null }, {
      where: {
        id: {
          [Op.in]: teamIds,
        },
        poolId: poolId, // Assurer que les équipes sont bien dans la pool spécifiée
      },
    });

    res.status(200).json({ message: 'Équipes retirées de la pool avec succès.' });
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

    // Récupérer les paramètres du teamSetup pour connaître le min et max par pool
    const teamSetup = await TeamSetup.findOne({ where: { tourneyId } });

    if (!teamSetup) {
      return res.status(404).json({ message: 'Configuration du tournoi non trouvée.' });
    }

    const { minTeamPerPool, maxTeamPerPool } = teamSetup;

    // Récupérer toutes les équipes non assignées et les pools du tournoi
    const unassignedTeams = await Team.findAll({
      where: {
        tourneyId,
        poolId: null,
      },
    });

    const pools = await Pool.findAll({ where: { tourneyId } });

    if (pools.length === 0) {
      return res.status(400).json({ message: 'Aucune pool disponible pour l\'assignation.' });
    }

    // Algorithme simple pour répartir les équipes de manière équilibrée
    let poolIndex = 0;
    for (const team of unassignedTeams) {
      const currentPool = pools[poolIndex];
      const teamsInPool = await Team.count({ where: { poolId: currentPool.id } });

      if (teamsInPool < maxTeamPerPool) {
        await team.update({ poolId: currentPool.id });
      }

      poolIndex = (poolIndex + 1) % pools.length; // Passer à la pool suivante
    }

    res.status(200).json({ message: 'Équipes assignées automatiquement aux pools.' });
  } catch (error) {
    console.error('Erreur lors de l\'assignation automatique des équipes :', error);
    res.status(500).json({ message: 'Erreur lors de l\'assignation automatique des équipes.', error });
  }
};