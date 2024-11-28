const { Pool, PoolSchedule, Field, SportsFields, Sport } = require('../models');
const { Op } = require('sequelize');
const { checkAndUpdateStatuses } = require('../utils/statusUtils');


/**
 * Assigner une pool à un terrain avec des horaires spécifiques
 */
exports.assignPoolToField = async (req, res) => {
  try {
    const { tourneyId, poolId } = req.params;
    const { fieldId, startTime, endTime, date } = req.body;

    // Validation des champs obligatoires
    if (!fieldId || !startTime || !endTime || !date) {
      return res
        .status(400)
        .json({
          message:
            'Les champs fieldId, startTime, endTime et date sont requis.',
        });
    }

    // Vérification de l'existence de la pool
    const pool = await Pool.findOne({ where: { id: poolId, tourneyId } });
    if (!pool) {
      return res
        .status(404)
        .json({ message: 'Pool non trouvée pour ce tournoi.' });
    }

    // Vérification de l'existence du terrain
    const field = await Field.findByPk(fieldId);
    if (!field) {
      return res.status(404).json({ message: 'Terrain non trouvé.' });
    }

    // Rechercher le sport programmé qui chevauche le startTime
    const sportsField = await SportsFields.findOne({
      where: {
        fieldId: fieldId,
        startTime: { [Op.lte]: startTime },
        endTime: { [Op.gt]: startTime },
      },
    });

    // Si aucun sport n'est trouvé au startTime, rechercher au endTime
    let sportId = null;
    if (sportsField) {
      sportId = sportsField.sportId;
    } else {
      const sportsFieldAtEndTime = await SportsFields.findOne({
        where: {
          fieldId: fieldId,
          startTime: { [Op.lt]: endTime },
          endTime: { [Op.gte]: endTime },
        },
      });
      if (sportsFieldAtEndTime) {
        sportId = sportsFieldAtEndTime.sportId;
      }
    }

    // Création du planning avec sportId pouvant être null
    const poolSchedule = await PoolSchedule.create({
      poolId,
      fieldId,
      sportId,
      startTime,
      endTime,
      date,
    });

    // Mettre à jour le statut global après l'assignation
    await checkAndUpdateStatuses(tourneyId);

    // Récupérer le poolSchedule avec le sport associé
    const updatedPoolSchedule = await PoolSchedule.findByPk(poolSchedule.id, {
      include: [{ model: Sport, as: 'sport' }],
    });

    res.status(201).json({
      message: 'Pool assignée au terrain avec succès.',
      poolSchedule: updatedPoolSchedule,
    });
  } catch (error) {
    console.error(
      'Erreur lors de l\'assignation de la pool au terrain :',
      error
    );
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
      return res
        .status(400)
        .json({
          message: 'Les champs startTime, endTime et date sont requis.',
        });
    }

    // Vérification de l'existence du PoolSchedule
    const poolSchedule = await PoolSchedule.findByPk(poolScheduleId);
    if (!poolSchedule) {
      return res.status(404).json({ message: 'PoolSchedule non trouvé.' });
    }

    // Mise à jour des informations
    if (fieldId) {
      poolSchedule.fieldId = fieldId;
    }
    poolSchedule.startTime = startTime;
    poolSchedule.endTime = endTime;
    poolSchedule.date = date;

    // Recalculer le sportId en fonction du nouveau fieldId et horaires
    const sportsField = await SportsFields.findOne({
      where: {
        fieldId: poolSchedule.fieldId,
        startTime: { [Op.lte]: startTime },
        endTime: { [Op.gt]: startTime },
      },
    });

    let sportId = null;
    if (sportsField) {
      sportId = sportsField.sportId;
    } else {
      const sportsFieldAtEndTime = await SportsFields.findOne({
        where: {
          fieldId: poolSchedule.fieldId,
          startTime: { [Op.lt]: endTime },
          endTime: { [Op.gte]: endTime },
        },
      });
      if (sportsFieldAtEndTime) {
        sportId = sportsFieldAtEndTime.sportId;
      }
    }

    poolSchedule.sportId = sportId;

    await poolSchedule.save();

    // Récupérer le poolSchedule avec le sport associé
    const updatedPoolSchedule = await PoolSchedule.findByPk(poolSchedule.id, {
      include: [{ model: Sport, as: 'sport' }],
    });

    res.status(200).json({
      message: 'PoolSchedule mis à jour avec succès.',
      poolSchedule: updatedPoolSchedule,
    });
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

    // Mettre à jour le statut global après l'assignation
    await checkAndUpdateStatuses(tourneyId);

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
    console.error(
      'Erreur lors de la récupération des plannings des pools :',
      error
    );
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
    console.error(
      'Erreur lors de la récupération des plannings de la pool :',
      error
    );
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};
