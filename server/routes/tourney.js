// server/routes/tourney.js
// Purpose: Define the routes for managing tournaments

const express = require('express');
const router = express.Router();
const {
    createTourney, getTourneys, getTourneyById, updateTourney, deleteTourney, createScheduleTourney,
    getSportsByField, getFieldsByTourneyId, getSportsFieldsByTourney
} = require('../controllers/tourneyController');
const { isAuthenticated, isAdmin } = require('../middlewares');

/*
--------------------------------
 Routes pour gérer les tournois 
--------------------------------
 */
router.post('/', isAuthenticated, isAdmin, createTourney); // Créer un tournoi (admin uniquement)
router.get('/:id', isAuthenticated, getTourneyById); // Récupérer un tournoi par son ID
router.get('/', isAuthenticated, getTourneys); // Récupérer tous les tournois
router.put('/:id', isAuthenticated, isAdmin, updateTourney); // Mettre à jour un tournoi (admin uniquement)
router.delete('/:id', isAuthenticated, isAdmin, deleteTourney); // Supprimer un tournoi (admin uniquement)

/*
--------------------------------
 Routes custom pour les tournois
--------------------------------
 */
router.get('/fields/:fieldId/sports', isAuthenticated, getSportsByField); // Récupérer les sports associés à un terrain
router.get('/:tourneyId/fields', isAuthenticated, getFieldsByTourneyId); // Récupérer les terrains d'un tournoi
router.get('/:id/sports-fields', isAuthenticated, getSportsFieldsByTourney); // Récupérer les sports associés aux terrains d'un tournoi

router.post('/:tourneyId/schedule', isAuthenticated, isAdmin, createScheduleTourney); // Ajouter le planning (admin uniquement)


// Ajouter la route manquante pour les sportsFields
const { createSportsFields } = require('../controllers/sportsFieldsController');
router.post('/sports-fields', isAuthenticated, isAdmin, createSportsFields); // Ajouter un sport à un terrain

module.exports = router;