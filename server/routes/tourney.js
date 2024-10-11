// --- backend/routes/tourney.js (ajout de la route pour SportField) ---
const express = require('express');
const router = express.Router();
const { createTourney, getTourneys, getTourneyById, updateTourney, deleteTourney, createScheduleTourney, createGroupSetup, getSportsByField } = require('../controllers/tourneyController');
const { isAuthenticated, isAdmin } = require('../middlewares');

// Routes pour gérer les tournois

router.post('/', isAuthenticated, isAdmin, createTourney); // Créer un tournoi (admin uniquement)
router.post('/:tourneyId/schedule', isAuthenticated, isAdmin, createScheduleTourney); // Ajouter le planning (admin uniquement)
router.post('/:tourneyId/group-setup', isAuthenticated, isAdmin, createGroupSetup); // Ajouter la configuration de groupe (admin uniquement)
router.get('/', isAuthenticated, getTourneys); // Récupérer tous les tournois
router.get('/:id', isAuthenticated, getTourneyById); // Récupérer un tournoi par son ID
router.put('/:id', isAuthenticated, isAdmin, updateTourney); // Mettre à jour un tournoi (admin uniquement)
router.delete('/:id', isAuthenticated, isAdmin, deleteTourney); // Supprimer un tournoi (admin uniquement)

router.get('/fields/:fieldId/sports', isAuthenticated, getSportsByField); // Récupérer les sports associés à un terrain


// Ajouter la route manquante pour les SportFields
const { createSportField } = require('../controllers/sportFieldController');
router.post('/sport-fields', isAuthenticated, isAdmin, createSportField); // Ajouter un sport à un terrain

module.exports = router;