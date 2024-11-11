// server/routes/pool.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { createPool, getPoolsByTourney, getPoolById, updatePool, deletePool } = require('../controllers/poolController');
const { isAuthenticated, isAdmin, authorizeTournamentAccess } = require('../middlewares');

// Routes pour gérer les pools liées à un tournoi
// Base URL: /api/tourneys/:tourneyId/pools

router.post('/', isAuthenticated, isAdmin, createPool); // Créer une pool (admin uniquement)
router.get('/', isAuthenticated, authorizeTournamentAccess, getPoolsByTourney); // Récupérer toutes les pools d'un tournoi
router.get('/:poolId', isAuthenticated, authorizeTournamentAccess, getPoolById); // Récupérer une pool par son ID
router.put('/:poolId', isAuthenticated, isAdmin, updatePool); // Mettre à jour une pool (admin uniquement)
router.delete('/:poolId', isAuthenticated, isAdmin, deletePool); // Supprimer une pool (admin uniquement)

module.exports = router;
