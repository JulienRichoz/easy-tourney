// server/routes/game.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createGame,
  getGamesByTourney,
  getGameById,
  updateGame,
  deleteGame,
  validateGames,
  getGamesByPoolSchedule,
  getGamesByPool,
} = require('../controllers/gameController');
const {
  isAuthenticated,
  isAdmin,
  authorizeTournamentAccess,
} = require('../middlewares');

// Base URL: http://localhost:8080/api/tourneys/:tourneyId/games
router.get('/by-pool-schedule/:poolScheduleId', isAuthenticated, authorizeTournamentAccess, getGamesByPoolSchedule);
router.get('/by-pool/:poolId', isAuthenticated, authorizeTournamentAccess, getGamesByPool);

router.post('/', isAuthenticated, isAdmin, createGame); // Créer un nouveau match
router.get('/', isAuthenticated, authorizeTournamentAccess, getGamesByTourney); // Récupérer tous les matchs du tournoi
router.get('/:gameId', isAuthenticated, authorizeTournamentAccess, getGameById); // Récupérer un match par ID
router.put('/:gameId', isAuthenticated, isAdmin, updateGame); // Mettre à jour un match
router.delete('/:gameId', isAuthenticated, isAdmin, deleteGame); // Supprimer un match
router.post('/validate', isAuthenticated, isAdmin, validateGames); // Valider les contraintes des matchs

module.exports = router;
