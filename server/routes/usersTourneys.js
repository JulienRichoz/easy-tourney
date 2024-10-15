const express = require('express');
const router = express.Router();
const { addUserToTourney, getTourneysByUser, removeUserFromTourney, getUsersByTourney } = require('../controllers/usersTourneysController');
const { isAuthenticated, isAdmin } = require('../middlewares');

// Ajouter un utilisateur à un tournoi
router.post('/', isAuthenticated, isAdmin, addUserToTourney);

// Récupérer les tournois pour un utilisateur donné
router.get('/:userId/tourneys', isAuthenticated, getTourneysByUser);

// Récupérer tous les utilisateurs d'un tournoi
router.get('/:tourneyId/users', isAuthenticated, getUsersByTourney);

// Supprimer un utilisateur d'un tournoi
router.delete('/:userId/tourneys/:tourneyId', isAuthenticated, isAdmin, removeUserFromTourney);

module.exports = router;
