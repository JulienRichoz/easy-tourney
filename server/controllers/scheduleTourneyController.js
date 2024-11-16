// controllers/scheduleTourney.js
const { ScheduleTourney, Tourney } = require('../models');

/**
 * Créer un planning pour un tournoi
 */
exports.createScheduleTourney = async (req, res) => {
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
      timeMatchRotation,
      timePoolRotation,
    } = req.body;

    if (!startTime || !endTime || !timeMatchRotation || !timePoolRotation) {
      return res.status(400).json({ message: "Les champs 'startTime', 'endTime', 'timeMatchRotation', et 'timePoolRotation' sont requis." });
    }

    const tourney = await Tourney.findByPk(tourneyId);

    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    const schedule = await ScheduleTourney.create({
      tourneyId,
      startTime,
      endTime,
      introStart,
      introEnd,
      lunchStart,
      lunchEnd,
      outroStart,
      outroEnd,
      timeMatchRotation,
      timePoolRotation,
    });

    res.status(201).json(schedule);
  } catch (error) {
    console.error('Erreur lors de la création du planning :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
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
      return res.status(404).json({ message: 'Aucun planning trouvé pour ce tournoi.' });
    }

    res.status(200).json(schedule);
  } catch (error) {
    console.error('Erreur lors de la récupération du planning :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};

/**
 * Mettre à jour un planning
 */
exports.updateScheduleTourney = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const updates = req.body;

    const schedule = await ScheduleTourney.findByPk(scheduleId);

    if (!schedule) {
      return res.status(404).json({ message: 'Planning non trouvé.' });
    }

    await schedule.update(updates);
    res.status(200).json(schedule);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du planning :', error);
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};