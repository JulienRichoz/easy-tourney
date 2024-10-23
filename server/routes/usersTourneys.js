// server/routes/usersTourneys.js

const express = require('express');
const router = express.Router();
const { addUserToTourney, getTourneysByUser, removeUserFromTourney, getUserInfoByTourney, getUnassignedUsersByTourney } = require('../controllers/usersTourneysController');
const { isAuthenticated, isAdmin } = require('../middlewares');

// Routes pour gérer les utilisateurs d'un tournoi
// http://localhost:3000/api/tourneys/:tourneyId/users

router.post('/', isAuthenticated, isAdmin, addUserToTourney); // Ajouter un utilisateur à un tournoi
router.get('/:userId', isAuthenticated, getUserInfoByTourney); // Récupérer les informations d'un utilisateur pour un tournoi donné
router.get('/unassigned-users', isAuthenticated, getUnassignedUsersByTourney) // Récupérer les utilisateurs sans team pour un tournoi donné
router.get('/:userId/tourneys', isAuthenticated, getTourneysByUser); // Récupérer les tournois pour un utilisateur donné
router.delete('/:userId/', isAuthenticated, isAdmin, removeUserFromTourney); // Supprimer un utilisateur d'un tournoi

module.exports = router;
