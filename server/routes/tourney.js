// server/routes/tourney.js
// Purpose: Define the routes for managing tournaments

const express = require('express');
const router = express.Router();
const {
    createTourney, getTourneys, getTourneyById, updateTourney, deleteTourney,
} = require('../controllers/tourneyController');

const { isAuthenticated, isAdmin } = require('../middlewares');

// Routes pour gérer les tournois
// http://localhost:3000/api/tourneys

router.post('/', isAuthenticated, isAdmin, createTourney); // Créer un tournoi (admin uniquement)
router.get('/:id', isAuthenticated, getTourneyById); // Récupérer un tournoi par son ID
router.get('/', isAuthenticated, getTourneys); // Récupérer tous les tournois
router.put('/:id', isAuthenticated, isAdmin, updateTourney); // Mettre à jour un tournoi (admin uniquement)
router.delete('/:id', isAuthenticated, isAdmin, deleteTourney); // Supprimer un tournoi (admin uniquement)

module.exports = router;