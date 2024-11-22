// server/routes/pool.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createPool,
  getPoolsByTourney,
  getPoolById,
  updatePool,
  deletePool,
  assignTeamsToPool,
  removeTeamsFromPool,
  autoAssignTeamsToPools,
  generatePools,
  deleteAllPools,
} = require('../controllers/poolController');
const {
  isAuthenticated,
  isAdmin,
  authorizeTournamentAccess,
  verifyPoolStatusDraft,
} = require('../middlewares');

// Routes pour gérer les pools liées à un tournoi
// Base URL: /api/tourneys/:tourneyId/pools

router.post('/', isAuthenticated, isAdmin, createPool);
router.get('/', isAuthenticated, authorizeTournamentAccess, getPoolsByTourney);
router.get('/:poolId', isAuthenticated, authorizeTournamentAccess, getPoolById);
router.put('/:poolId', isAuthenticated, isAdmin, verifyPoolStatusDraft, updatePool);
router.delete('/reset', isAuthenticated, isAdmin, verifyPoolStatusDraft, deleteAllPools); // Placer avant poolId pour ordre des requetes
router.delete('/:poolId', isAuthenticated, isAdmin, verifyPoolStatusDraft, deletePool);
// Routes pour assigner et retirer des équipes de pools
router.post('/:poolId/assign-teams', isAuthenticated, isAdmin, verifyPoolStatusDraft, assignTeamsToPool);
router.post('/:poolId/remove-teams', isAuthenticated, isAdmin, verifyPoolStatusDraft, removeTeamsFromPool);
router.post('/auto-assign', isAuthenticated, isAdmin, verifyPoolStatusDraft, autoAssignTeamsToPools);

// Strategy Pattern to generate Pools with teams depending on the strategy pattern used
router.post('/generate', isAuthenticated, isAdmin, verifyPoolStatusDraft, generatePools);

module.exports = router;
