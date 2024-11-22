// server/routes/tourney.js
// Purpose: Define the routes for managing tournaments

const express = require('express');
const router = express.Router();
const {
  createTourney,
  getTourneys,
  getTourneyById,
  updateTourney,
  deleteTourney,
  getTourneyTeamsDetails,
  getTourneyStatuses,
  joinTourneyWithToken,
  getRegistrationStatus,
  getTourneyPoolsDetails,
  getTourneyPlanningDetails,
  generatePoolPlanning,
} = require('../controllers/tourneyController');

const {
  isAuthenticated,
  isAdmin,
  authorizeTournamentAccess,
} = require('../middlewares');

// Routes pour gérer les tournois
// http://localhost:3000/api/tourneys

router.post('/', isAuthenticated, isAdmin, createTourney); // Créer un tournoi (admin uniquement)
router.get('/:tourneyId', isAuthenticated, getTourneyById); // Récupérer un tournoi par son ID
router.get('/', isAuthenticated, getTourneys); // Récupérer tous les tournois
router.put('/:tourneyId', isAuthenticated, isAdmin, updateTourney); // Mettre à jour un tournoi (admin uniquement)
router.delete('/:tourneyId', isAuthenticated, isAdmin, deleteTourney); // Supprimer un tournoi (admin uniquement)
router.get('/:tourneyId/statuses', isAuthenticated, getTourneyStatuses); // Récupérer tous les statuts d'un tournoi
router.get('/:tourneyId/registration-status', isAuthenticated, authorizeTournamentAccess, getRegistrationStatus); // Récupérer le statut d'inscription pour un user

router.post('/join', isAuthenticated, joinTourneyWithToken); // Rejoindre un tournoi via un token

// Aggregate/custom routes
router.get('/:tourneyId/teams-details', isAuthenticated, authorizeTournamentAccess, getTourneyTeamsDetails); // Team Page -> get all data required in one request
router.get('/:tourneyId/pools-details', isAuthenticated, authorizeTournamentAccess, getTourneyPoolsDetails); // Team Pool -> get all data required in one request

module.exports = router;
