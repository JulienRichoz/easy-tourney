const express = require('express');
const router = express.Router();
const { addUserToTourney, getTourneysByUser, removeUserFromTourney } = require('../controllers/usersTourneysController');
const { isAuthenticated, isAdmin } = require('../middlewares');

// http://localhost:3000/api/users-tourneys
router.post('/', isAuthenticated, isAdmin, addUserToTourney); // Ajouter un utilisateur à un tournoi
router.get('/:userId/tourneys', isAuthenticated, getTourneysByUser); // Récupérer les tournois pour un utilisateur donné
router.delete('/:userId/tourneys/:tourneyId', isAuthenticated, isAdmin, removeUserFromTourney); // Supprimer un utilisateur d'un tournoi

module.exports = router;
