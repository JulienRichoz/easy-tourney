// server/routes/tourney.js
// Purpose: Define the routes for managing tournaments

const express = require('express');
const router = express.Router();
const {
    createTourney, getTourneys, getTourneyById, updateTourney, deleteTourney, getTourneyTeamsDetails, getTourneyStatuses, generateInviteToken, joinTourneyWithToken
} = require('../controllers/tourneyController');

const { isAuthenticated, isAdmin } = require('../middlewares');

// Routes pour gérer les tournois
// http://localhost:3000/api/tourneys

router.post('/', isAuthenticated, isAdmin, createTourney); // Créer un tournoi (admin uniquement)
router.get('/:id', isAuthenticated, getTourneyById); // Récupérer un tournoi par son ID
router.get('/', isAuthenticated, getTourneys); // Récupérer tous les tournois
router.put('/:id', isAuthenticated, isAdmin, updateTourney); // Mettre à jour un tournoi (admin uniquement)
router.delete('/:id', isAuthenticated, isAdmin, deleteTourney); // Supprimer un tournoi (admin uniquement)
router.get('/:id/statuses', isAuthenticated, isAdmin, getTourneyStatuses);
router.post('/:id/generate-invite', isAuthenticated, isAdmin, generateInviteToken) // Générer un token d'invitation
router.post('/join', isAuthenticated, joinTourneyWithToken) // Rejoindre un tournoi via un token

// Aggregate/custom routes
router.get('/:id/teams-details', isAuthenticated, getTourneyTeamsDetails); // Team Page -> get all data required in one request

module.exports = router;