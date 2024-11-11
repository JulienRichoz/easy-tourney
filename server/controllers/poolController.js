const { Pool, Tourney, Team } = require('../models');

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
