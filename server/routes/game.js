// server/routes/game.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const tourneyRoles = require('../config/tourneyRoles');

const {
  createGame,
  getGamesByTourney,
  getGameById,
  updateGame,
  deleteGame,
  validateGames,
  getGamesByPoolSchedule,
  getGamesByPool,
  getNextGamesForUser,
} = require('../controllers/gameController');
const {
  isAuthenticated,
  isAdmin,
  authorizeTournamentAccess,
} = require('../middlewares');

const { authorizeTourneyRoles } = require('../middlewares/authorizeTourneyRole');


// Base URL: http://localhost:3000/api/tourneys/:tourneyId/games
router.get('/by-pool-schedule/:poolScheduleId', isAuthenticated, authorizeTournamentAccess, getGamesByPoolSchedule); // Récupérer les matchs par poolSchedule
router.get('/by-pool/:poolId', isAuthenticated, authorizeTournamentAccess, getGamesByPool); // Récupérer les matchs par pool
router.get('/next', isAuthenticated, authorizeTournamentAccess, getNextGamesForUser); // Récupérer les prochains matchs de l'utilisateur

router.post('/', isAuthenticated, isAdmin, createGame); // Créer un nouveau match
router.get('/', isAuthenticated, authorizeTournamentAccess, getGamesByTourney); // Récupérer tous les matchs du tournoi
router.get('/:gameId', isAuthenticated, authorizeTournamentAccess, getGameById); // Récupérer un match par ID
router.put('/:gameId', isAuthenticated, authorizeTournamentAccess, authorizeTourneyRoles([tourneyRoles.ASSISTANT]), updateGame); // Mettre à jour un match
router.delete('/:gameId', isAuthenticated, isAdmin, deleteGame); // Supprimer un match
router.post('/validate', isAuthenticated, isAdmin, validateGames); // Valider les contraintes des matchs

module.exports = router;
