const { Pool, PoolSchedule, Field } = require('../models');

/**
 * Assigner une pool à un terrain avec des horaires spécifiques
 */
exports.assignPoolToField = async (req, res) => {
  try {
    const { tourneyId, poolId } = req.params;
    const { fieldId, startTime, endTime, date } = req.body;

    // Vérifier si la pool existe
    const pool = await Pool.findOne({ where: { id: poolId, tourneyId } });
    if (!pool) {
      return res.status(404).json({ message: 'Pool non trouvée.' });
    }

    // Vérifier si le terrain existe
    const field = await Field.findByPk(fieldId);
    if (!field) {
      return res.status(404).json({ message: 'Terrain non trouvé.' });
    }

    // Vérifier si les horaires sont valides
    if (!startTime || !endTime || !date) {
      return res.status(400).json({ message: 'Les horaires et la date sont requis.' });
    }

    // Créer ou mettre à jour l'affectation de la pool au terrain
    const poolSchedule = await PoolSchedule.create({
      poolId,
      fieldId,
      startTime,
      endTime,
      date,
    });

    res.status(201).json({ message: 'Pool assignée au terrain avec succès.', poolSchedule });
  } catch (error) {
    console.error('Erreur lors de l\'assignation de la pool au terrain :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};

/**
 * Mettre à jour une assignation de pool à un terrain
 */
exports.updatePoolSchedule = async (req, res) => {
  try {
    const { poolScheduleId } = req.params;
    const { fieldId, startTime, endTime, date } = req.body;

    // Vérifier si le PoolSchedule existe
    const poolSchedule = await PoolSchedule.findByPk(poolScheduleId);
    if (!poolSchedule) {
      return res.status(404).json({ message: 'PoolSchedule non trouvé.' });
    }

    // Vérifier si le terrain existe
    if (fieldId) {
      const field = await Field.findByPk(fieldId);
      if (!field) {
        return res.status(404).json({ message: 'Terrain non trouvé.' });
      }
    }

    // Vérifier les horaires
    if (!startTime || !endTime || !date) {
      return res.status(400).json({ message: 'Les horaires et la date sont requis.' });
    }

    // Mettre à jour l'assignation
    await poolSchedule.update({ fieldId, startTime, endTime, date });

    res.status(200).json({ message: 'PoolSchedule mis à jour avec succès.', poolSchedule });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du PoolSchedule :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};

/**
 * Supprimer une assignation de pool à un terrain
 */
exports.deletePoolSchedule = async (req, res) => {
  try {
    const { poolScheduleId } = req.params;

    // Vérifier si le PoolSchedule existe
    const poolSchedule = await PoolSchedule.findByPk(poolScheduleId);
    if (!poolSchedule) {
      return res.status(404).json({ message: 'PoolSchedule non trouvé.' });
    }

    // Supprimer l'assignation
    await poolSchedule.destroy();

    res.status(200).json({ message: 'PoolSchedule supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression du PoolSchedule :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};

/**
 * Récupérer tous les plannings des pools d'un tournoi
 */
exports.getPoolSchedulesByTourney = async (req, res) => {
  try {
    const { tourneyId } = req.params;

    const poolSchedules = await PoolSchedule.findAll({
      include: [
        {
          model: Pool,
          as: 'pool',
          where: { tourneyId },
          attributes: ['id', 'name'],
        },
        {
          model: Field,
          as: 'field',
          attributes: ['id', 'name'],
        },
      ],
    });

    res.status(200).json(poolSchedules);
  } catch (error) {
    console.error('Erreur lors de la récupération des plannings des pools :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};
