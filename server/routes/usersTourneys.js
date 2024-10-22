const express = require('express');
const router = express.Router();
const { addUserToTourney, getTourneysByUser, removeUserFromTourney, getUsersByTourney, getUnassignedUsersByTourney } = require('../controllers/usersTourneysController');
const { isAuthenticated, isAdmin } = require('../middlewares');

// http://localhost:3000/api/users-tourneys
router.post('/', isAuthenticated, isAdmin, addUserToTourney); // Ajouter un utilisateur à un tournoi
router.get('/:userId/tourneys', isAuthenticated, getTourneysByUser); // Récupérer les tournois pour un utilisateur donné
router.get('/:tourneyId/users', isAuthenticated, getUsersByTourney); // Récupérer tous les utilisateurs d'un tournoi
router.delete('/:userId/tourneys/:tourneyId', isAuthenticated, isAdmin, removeUserFromTourney); // Supprimer un utilisateur d'un tournoi
router.get('/:tourneyId/unassigned-users', isAuthenticated, getUnassignedUsersByTourney); // Récupérer les utilisateurs non assignés d'un tournoi

module.exports = router;
