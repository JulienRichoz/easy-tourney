// routes/planning.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { generatePoolPlanning, getPlanningDetails } = require('../controllers/planningController');
const { isAuthenticated, isAdmin } = require('../middlewares');

// Base URL: /api/tourneys/:tourneyId/planning

// Générer un planning pour les pools
router.post('/pools/generate', isAuthenticated, isAdmin, generatePoolPlanning);

// Récupérer les détails complets du planning (pools + matchs)
router.get('/details', isAuthenticated, getPlanningDetails);

module.exports = router;
