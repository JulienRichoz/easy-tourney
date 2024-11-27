const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  assignPoolToField,
  updatePoolSchedule,
  deletePoolSchedule,
  getPoolSchedulesByTourney,
  getPoolSchedulesByPool,
} = require('../controllers/poolScheduleController');
const { isAuthenticated, isAdmin } = require('../middlewares');

// Base URL: /api/tourneys/:tourneyId/pools/schedule

// Routes pour la gestion des plannings de pools
router.post('/:poolId', isAuthenticated, isAdmin, assignPoolToField); // Assigner une pool à un terrain
router.put('/:poolScheduleId', isAuthenticated, isAdmin, updatePoolSchedule); // Mettre à jour une assignation de pool à un terrain
router.delete('/:poolScheduleId', isAuthenticated, isAdmin, deletePoolSchedule); // Supprimer une assignation de pool à un terrain
router.get('/', isAuthenticated, getPoolSchedulesByTourney); // Récupérer tous les plannings d'un tournoi

// Gestion des plannings d'une pool spécifique
router.get('/:poolId/schedules', isAuthenticated, getPoolSchedulesByPool); // Récupérer les plannings d'une pool spécifique

module.exports = router;

/**
 * TODO:
 * 1) AJUSTER ALGORITHME GENERATION GAMES -Tourney id 2, grosses erreurs dans la generation des games ! 
 * REFLECHIR a la vue planning pool <-> game => final
 * OPTIONNEL: Modifier vue sports-fields pour afficher 1 seul calendar ?
 */
