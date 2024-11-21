// routes/planning.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  generatePoolPlanning,
  getPlanningDetails,
  resetPoolPlanning,
  validatePoolPlanning
} = require('../controllers/planningController');
const { isAuthenticated, isAdmin } = require('../middlewares');

// Base URL: /api/tourneys/:tourneyId/planning

router.post('/pools/generate', isAuthenticated, isAdmin, generatePoolPlanning); // Générer un planning pour les pools
router.post('/pools/validate', validatePoolPlanning); // Valider un planning pour les pools
router.delete('/pools/reset', isAuthenticated, isAdmin, resetPoolPlanning); // reset pool planning

router.get('/details', isAuthenticated, getPlanningDetails); // Récupérer les détails complets du planning (pools + matchs)

module.exports = router;
