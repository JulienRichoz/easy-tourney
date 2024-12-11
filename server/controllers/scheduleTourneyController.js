// controllers/scheduleTourney.js
const { ScheduleTourney, Tourney, sequelize } = require('../models');

/**
 * Créer un planning pour un tournoi
 */
exports.createScheduleTourney = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { tourneyId } = req.params;
    const {
      startTime,
      endTime,
      introStart,
      introEnd,
      lunchStart,
      lunchEnd,
      outroStart,
      outroEnd,
      poolDuration,
      gameDuration,
      transitionPoolTime,
      transitionGameTime,
      useDefaultSettings,
    } = req.body;

    // Vérifier si un planning existe déjà pour ce tournoi dans la transaction
    const existingSchedule = await ScheduleTourney.findOne({
      where: { tourneyId },
      transaction, // Inclure dans la transaction
      lock: transaction.LOCK.UPDATE, // Verrouiller la ligne pour éviter les conditions de concurrence
    });
    if (existingSchedule) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: 'Un planning existe déjà pour ce tournoi.' });
    }

    // Vérifier les champs requis
    if (!startTime || !endTime || !poolDuration || !gameDuration) {
      await transaction.rollback();
      return res.status(400).json({
        message:
          "Les champs 'startTime', 'endTime', 'poolDuration', et 'gameDuration' sont requis.",
      });
    }

    // Vérifier l'existence du tournoi dans la transaction
    const tourney = await Tourney.findByPk(tourneyId, { transaction });
    if (!tourney) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    // Créer le planning dans la transaction
    const schedule = await ScheduleTourney.create(
      {
        tourneyId,
        startTime,
        endTime,
        introStart,
        introEnd,
        lunchStart,
        lunchEnd,
        outroStart,
        outroEnd,
        poolDuration,
        gameDuration,
        transitionPoolTime,
        transitionGameTime,
        useDefaultSettings,
      },
      { transaction }
    );

    // Valider la transaction
    await transaction.commit();
    res.status(201).json(schedule);
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    if (transaction) await transaction.rollback();
    console.error('Erreur lors de la création du planning :', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

/**
 * Récupérer le planning d'un tournoi
 */
exports.getScheduleTourneyByTourney = async (req, res) => {
  try {
    const { tourneyId } = req.params;

    const schedule = await ScheduleTourney.findOne({
      where: { tourneyId },
    });

    if (!schedule) {
      return res
        .status(404)
        .json({ message: 'Aucun planning trouvé pour ce tournoi.' });
    }

    res.status(200).json(schedule);
  } catch (error) {
    console.error('Erreur lors de la récupération du planning :', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

/**
 * Mettre à jour un planning
 */
exports.updateScheduleTourney = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { scheduleId } = req.params;
    const updates = req.body;

    // Trouver le planning dans la transaction
    const schedule = await ScheduleTourney.findByPk(scheduleId, { transaction });
    if (!schedule) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Planning non trouvé.' });
    }

    // Mettre à jour le planning dans la transaction
    await schedule.update(updates, { transaction });

    // Valider la transaction
    await transaction.commit();
    res.status(200).json(schedule);
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    if (transaction) await transaction.rollback();
    console.error('Erreur lors de la mise à jour du planning :', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};
