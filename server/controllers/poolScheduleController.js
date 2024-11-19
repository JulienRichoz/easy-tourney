const { Pool, PoolSchedule, Field, SportsFields } = require('../models');
const { Op } = require('sequelize');

/**
 * Assigner une pool à un terrain avec des horaires spécifiques
 */
exports.assignPoolToField = async (req, res) => {
  try {
    const { tourneyId, poolId } = req.params;
    const { fieldId, startTime, endTime, date } = req.body;

    // Validation des champs obligatoires
    if (!fieldId || !startTime || !endTime || !date) {
      return res.status(400).json({ message: 'Les champs fieldId, startTime, endTime et date sont requis.' });
    }

    // Vérification de l'existence de la pool
    const pool = await Pool.findOne({ where: { id: poolId, tourneyId } });
    if (!pool) {
      return res.status(404).json({ message: 'Pool non trouvée pour ce tournoi.' });
    }

    // Vérification de l'existence du terrain
    const field = await Field.findByPk(fieldId);
    if (!field) {
      return res.status(404).json({ message: 'Terrain non trouvé.' });
    }

    // Récupérer le sportId en fonction du terrain et de l'horaire
    const sportsField = await SportsFields.findOne({
      where: {
        fieldId: fieldId,
        startTime: { [Op.lte]: startTime },
        endTime: { [Op.gte]: endTime },
      },
    });

    if (!sportsField) {
      return res.status(400).json({ message: 'Aucun sport programmé sur ce terrain à cet horaire.' });
    }

    const sportId = sportsField.sportId;

    // Création du planning
    const poolSchedule = await PoolSchedule.create({
      poolId,
      fieldId,
      sportId,
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

    // Validation des champs obligatoires
    if (!startTime || !endTime || !date) {
      return res.status(400).json({ message: 'Les champs startTime, endTime et date sont requis.' });
    }

    // Vérification de l'existence du PoolSchedule
    const poolSchedule = await PoolSchedule.findByPk(poolScheduleId);
    if (!poolSchedule) {
      return res.status(404).json({ message: 'PoolSchedule non trouvé.' });
    }

    // Mise à jour des informations
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

    // Vérification de l'existence du PoolSchedule
    const poolSchedule = await PoolSchedule.findByPk(poolScheduleId);
    if (!poolSchedule) {
      return res.status(404).json({ message: 'PoolSchedule non trouvé.' });
    }

    // Suppression
    await poolSchedule.destroy();

    res.status(200).json({ message: 'PoolSchedule supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression du PoolSchedule :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};

/**
 * Récupérer tous les plannings d'un pool d'un tournoi
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

exports.getPoolSchedulesByPool = async (req, res) => {
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
    console.error('Erreur lors de la récupération des plannings de la pool :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};
