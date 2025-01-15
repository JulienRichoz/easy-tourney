// server/middlewares/statusMiddleware.js
// Middleware pour vérifier les statuts des pages de tournooi
const { Tourney } = require('../models');

/**
 * Middleware pour vérifier si le statut poolStatus est 'draft'.
 */
const verifyPoolStatusDraft = async (req, res, next) => {
  const { tourneyId } = req.params;

  try {
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    if (tourney.poolStatus === 'completed') {
      return res
        .status(403)
        .json({
          message: 'L\'action requiert que le poolStatus soit en mode édition.',
        });
    }

    next(); // Passer à la prochaine étape si le statut est correct
  } catch (error) {
    console.error('Erreur lors de la vérification du poolStatus:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

/**
 * Middleware pour vérifier si le statut fieldAssignmentStatus est 'draft'.
 */
const verifyFieldAssignmentStatus = async (req, res, next) => {
  const { tourneyId } = req.params;

  try {
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    if (tourney.fieldAssignmentStatus === 'completed') {
      return res
        .status(403)
        .json({
          message:
            'L\'action requiert que la page Terrain soit en mode édition.',
        });
    }

    next(); // Passer à la prochaine étape si le statut est correct
  } catch (error) {
    console.error(
      'Erreur lors de la vérification du fieldAssignmentStatus:',
      error
    );
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

/**
 * Middleware pour vérifier si le statut sportAssignmentStatus est 'draft'.
 */
const verifySportAssignmentStatus = async (req, res, next) => {
  const { tourneyId } = req.params;

  try {
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    if (tourney.sportAssignmentStatus === 'completed') {
      return res
        .status(403)
        .json({
          message:
            'L\'action requiert que la page Assignation sport-terrain soit en mode édition.',
        });
    }

    next(); // Passer à la prochaine étape si le statut est correct
  } catch (error) {
    console.error(
      'Erreur lors de la vérification du sportAssignmentStatus:',
      error
    );
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

/**
 * Middleware pour vérifier si le statut registationStatus est 'active'. (inscription ouvertes)
 */
const verifyRegistrationStatusActive = async (req, res, next) => {
  const { tourneyId } = req.params;

  try {
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    if (tourney.registrationStatus !== 'active') {
      return res
        .status(403)
        .json({
          message: 'L\'action requiert que le registrationStatus soit actif.',
        });
    }

    next();
  } catch (error) {
    console.error(
      'Erreur lors de la vérification du registrationStatus:',
      error
    );
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

/**
 * Middleware pour vérifier si le statut planningStatus est 'draft'.
 */
const verifyPlanningStatus = async (req, res, next) => {
  const { tourneyId } = req.params;

  try {
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    if (tourney.planningStatus === 'completed') {
      return res
        .status(403)
        .json({
          message:
            'L\'action requiert que la page Planning soit en mode édition.',
        });
    }

    next(); // Passer à la prochaine étape si le statut est correct
  } catch (error) {
    console.error('Erreur lors de la vérification du planningStatus:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  verifyPoolStatusDraft,
  verifyRegistrationStatusActive,
  verifyFieldAssignmentStatus,
  verifySportAssignmentStatus,
  verifyPlanningStatus,
};
