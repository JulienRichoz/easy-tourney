// server/utils/statusUtils.js

const {
  Tourney,
  Field,
  SportsFields,
  TeamSetup,
  PoolSchedule,
  Pool,
  Game,
} = require('../models');

/**
 * Met à jour le statut global du tournoi en fonction des statuts des composants.
 * @param {Tourney} tourney - Instance du tournoi.
 */
const updateGlobalStatus = async (tourney) => {
  let newStatus = tourney.status;

  // Vérifier si tous les statuts des composants sont 'completed'
  const allComponentsCompleted = [
    tourney.fieldAssignmentStatus === 'completed',
    tourney.sportAssignmentStatus === 'completed',
    tourney.registrationStatus === 'completed',
    tourney.poolStatus === 'completed',
    tourney.planningStatus === 'completed',
  ].every(Boolean);

  if (allComponentsCompleted && tourney.status === 'draft') {
    newStatus = 'ready';
  }

  // Mettre à jour le statut global
  if (tourney.status !== newStatus) {
    tourney.status = newStatus;
    await tourney.save();
  }
};

/**
 * Vérifie et met à jour les statuts des composants.
 * @param {number} tourneyId - ID du tournoi.
 */
const checkAndUpdateStatuses = async (tourneyId) => {
  const tourney = await Tourney.findByPk(tourneyId);
  if (!tourney) {
    throw new Error('Tournoi non trouvé');
  }

  // fieldAssignmentStatus: notStarted <-> draft
  const fieldsAssigned = await Field.count({ where: { tourneyId } });
  if (fieldsAssigned > 0 && tourney.fieldAssignmentStatus === 'notStarted') {
    tourney.fieldAssignmentStatus = 'draft';
  } else if (
    fieldsAssigned === 0 &&
    tourney.fieldAssignmentStatus !== 'notStarted'
  ) {
    tourney.fieldAssignmentStatus = 'notStarted';
  }
  await tourney.save();

  // sportAssignmentStatus: notStarted <-> draft
  const sportsAssigned = await SportsFields.count({
    include: [
      {
        model: Field,
        as: 'field',
        where: { tourneyId },
      },
    ],
  });
  if (sportsAssigned > 0 && tourney.sportAssignmentStatus === 'notStarted') {
    tourney.sportAssignmentStatus = 'draft';
  } else if (
    sportsAssigned === 0 &&
    tourney.sportAssignmentStatus !== 'notStarted'
  ) {
    tourney.sportAssignmentStatus = 'notStarted';
  }
  await tourney.save();

  // registrationStatus: notStarted <-> draft/active
  const teamSetup = await TeamSetup.findOne({ where: { tourneyId } });
  if (teamSetup && tourney.registrationStatus === 'notStarted') {
    tourney.registrationStatus = 'draft';
  } else if (
    !teamSetup &&
    (tourney.registrationStatus === 'draft' ||
      tourney.registrationStatus === 'active')
  ) {
    tourney.registrationStatus = 'notStarted';
  }
  await tourney.save();

  // poolStatus: notStarted <-> draft/active
  const poolsCount = await Pool.count({ where: { tourneyId } });
  const hasMinMaxTeamPerPool =
    teamSetup &&
    teamSetup.minTeamPerPool !== null &&
    teamSetup.maxTeamPerPool !== null;

  if (
    (poolsCount > 0 || hasMinMaxTeamPerPool) &&
    tourney.poolStatus === 'notStarted'
  ) {
    tourney.poolStatus = 'draft';
  } else if (
    poolsCount === 0 &&
    !hasMinMaxTeamPerPool &&
    tourney.poolStatus !== 'notStarted'
  ) {
    tourney.poolStatus = 'notStarted';
  }
  await tourney.save();

  // planningStatus: notStarted <-> draft
  if (tourney.planningStatus === 'notStarted') {
    const hasPoolSchedules = await PoolSchedule.count({
      include: [
        {
          model: Pool,
          as: 'pool',
          where: { tourneyId },
          required: true,
        },
      ],
    });

    const hasGames = await Game.count({ where: { tourneyId } }) > 0;
    if (hasPoolSchedules || hasGames) {
      tourney.planningStatus = 'draft';
    }
  }
  await tourney.save();

  // Mettre à jour le statut global
  await updateGlobalStatus(tourney);
};

/**
 * Récupère le statut d'enregistrement d'un tournoi.
 * @param {number} tourneyId - ID du tournoi.
 * @returns {Promise<string>} - Le statut d'enregistrement du tournoi.
 * @throws {Error} - Si le tournoi n'est pas trouvé.
 */
const getRegistrationStatus = async (tourneyId) => {
  const tourney = await Tourney.findByPk(tourneyId);
  if (!tourney) {
    throw new Error('Tournoi non trouvé');
  }
  return tourney.registrationStatus;
};

/**
 * Vérifie si le poolStatus est actif pour un tournoi.
 * @param {number} tourneyId - L'ID du tournoi.
 * @returns {Promise<boolean>} - `true` si le statut est 'active', sinon `false`.
 */
const isPoolStatusActive = async (tourneyId) => {
  const tourney = await Tourney.findByPk(tourneyId);
  if (!tourney) {
    throw new Error('Tournoi non trouvé');
  }
  return tourney && tourney.poolStatus === 'active';
};

module.exports = {
  checkAndUpdateStatuses,
  updateGlobalStatus,
  getRegistrationStatus,
  isPoolStatusActive,
};
