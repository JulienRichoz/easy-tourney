// server/routes/gameEvent.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const tourneyRoles = require('../config/tourneyRoles');

const {
  createGameEvent,
  getGameEvents,
  updateGameEvent,
  deleteGameEvent,
} = require('../controllers/gameEventController');
const {
  isAuthenticated,
  authorizeTournamentAccess,
} = require('../middlewares');

const { authorizeTourneyRoles } = require('../middlewares/authorizeTourneyRole');

// Base URL: /api/tourneys/:tourneyId/games/:gameId/events

router.post('/', isAuthenticated, authorizeTournamentAccess, authorizeTourneyRoles([tourneyRoles.ASSISTANT]), createGameEvent); // Créer un événement pour un match
router.get('/', isAuthenticated, authorizeTournamentAccess, getGameEvents); // Récupérer les événements d'un match
router.put('/:eventId', isAuthenticated, authorizeTournamentAccess, authorizeTourneyRoles([tourneyRoles.ASSISTANT]), updateGameEvent); // Mettre à jour un événement
router.delete('/:eventId', isAuthenticated, authorizeTournamentAccess, authorizeTourneyRoles([tourneyRoles.ASSISTANT]), deleteGameEvent); // Supprimer un événement

module.exports = router;
