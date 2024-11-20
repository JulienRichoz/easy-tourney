// server/routes/gameEvent.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createGameEvent,
  getGameEventsByGame,
  updateGameEvent,
  deleteGameEvent,
} = require('../controllers/gameEventController');
const {
  isAuthenticated,
  authorizeTournamentAccess,
} = require('../middlewares');

// Base URL: /api/tourneys/:tourneyId/games/:gameId/events

router.post('/', isAuthenticated, createGameEvent); // Créer un événement pour un match
router.get(
  '/',
  isAuthenticated,
  authorizeTournamentAccess,
  getGameEventsByGame
); // Récupérer les événements d'un match
router.put('/:eventId', isAuthenticated, updateGameEvent); // Mettre à jour un événement
router.delete('/:eventId', isAuthenticated, deleteGameEvent); // Supprimer un événement

module.exports = router;
