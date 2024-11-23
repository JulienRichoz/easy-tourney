// routes/planning.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  generatePoolPlanning,
  getPlanningDetails,
  resetPoolPlanning,
  validatePoolPlanning,
  generateGamePlanning,
  validateGamePlanning,
  resetGamePlanning,
  getPlanningAdvice
} = require('../controllers/planningController');
const { isAuthenticated, isAdmin } = require('../middlewares');

// Base URL: /api/tourneys/:tourneyId/planning

router.post('/pools/generate', isAuthenticated, isAdmin, generatePoolPlanning); // Générer un planning pour les pools
router.post('/pools/validate', isAuthenticated, isAdmin, validatePoolPlanning); // Valider un planning pour les pools
router.delete('/pools/reset', isAuthenticated, isAdmin, resetPoolPlanning); // reset pool planning

router.post('/games/generate', isAuthenticated, isAdmin, generateGamePlanning); // Générer les matchs
router.post('/games/validate', isAuthenticated, isAdmin, validateGamePlanning); // Valider les matchs
router.delete('/games/reset', isAuthenticated, isAdmin, resetGamePlanning); // Reset game planning

router.get('/details', isAuthenticated, getPlanningDetails); // Récupérer les détails complets du planning (pools + matchs)
router.get('/advice', isAuthenticated, isAdmin, getPlanningAdvice); // Récupérer les conseils pour le planning

module.exports = router;
