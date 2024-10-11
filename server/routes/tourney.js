const express = require('express');
const router = express.Router();
const { createTourney, getTourneys, getTourneyById, updateTourney, deleteTourney, createScheduleTourney, createGroupSetup } = require('../controllers/tourneyController');
const { isAuthenticated, isAdmin } = require('../middlewares');

// Routes pour gérer les tournois

router.post('/', isAuthenticated, isAdmin, createTourney); // Créer un tournoi (admin uniquement)
router.post('/:tourneyId/schedule', isAuthenticated, isAdmin, createScheduleTourney); // Ajouter le planning (admin uniquement)
router.post('/:tourneyId/groupsetup', isAuthenticated, isAdmin, createGroupSetup); // Ajouter la configuration de groupe (admin uniquement)
router.get('/', isAuthenticated, getTourneys); // Récupérer tous les tournois
router.get('/:id', isAuthenticated, getTourneyById); // Récupérer un tournoi par son ID
router.put('/:id', isAuthenticated, isAdmin, updateTourney); // Mettre à jour un tournoi (admin uniquement)
router.delete('/:id', isAuthenticated, isAdmin, deleteTourney); // Supprimer un tournoi (admin uniquement)

module.exports = router;
