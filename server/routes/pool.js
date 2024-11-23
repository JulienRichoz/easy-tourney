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
  removeAllTeamsFromPools,
  generateMissingPools,
  populateMissingPools,
} = require('../controllers/poolController');
const {
  isAuthenticated,
  isAdmin,
  authorizeTournamentAccess,
  verifyPoolStatusDraft,
} = require('../middlewares');

// Routes pour gérer les pools liées à un tournoi
// Base URL: /api/tourneys/:tourneyId/pools

// Routes les plus spécifiques en premières
router.post('/generate', isAuthenticated, isAdmin, verifyPoolStatusDraft, generatePools); // Générer des pools automatiquement sans supprimer les existants
router.post('/populate', isAuthenticated, isAdmin, verifyPoolStatusDraft, autoAssignTeamsToPools); // Assigner les équipes non assignées aux pools existantes
router.post('/generate-missing', isAuthenticated, isAdmin, verifyPoolStatusDraft, generateMissingPools); // Générer les pools manquantes
router.post('/populate-missing', isAuthenticated, isAdmin, verifyPoolStatusDraft, populateMissingPools); // Assigner les équipes non assignées aux pools manquantes

router.delete('/reset', isAuthenticated, isAdmin, verifyPoolStatusDraft, deleteAllPools); // Supprimer toutes les pools (hard delete)
router.delete('/remove-teams', isAuthenticated, isAdmin, verifyPoolStatusDraft, removeAllTeamsFromPools); // Retirer toutes les équipes des pools sans supprimer les pools

router.delete('/:poolId', isAuthenticated, isAdmin, verifyPoolStatusDraft, deletePool); // Supprimer un pool spécifique
router.put('/:poolId', isAuthenticated, isAdmin, verifyPoolStatusDraft, updatePool); // Mettre à jour un pool spécifique

// Routes pour assigner et retirer des équipes de pools
router.post('/:poolId/assign-teams', isAuthenticated, isAdmin, verifyPoolStatusDraft, assignTeamsToPool);
router.post('/:poolId/remove-teams', isAuthenticated, isAdmin, verifyPoolStatusDraft, removeTeamsFromPool);

// Routes pour les opérations globales sur les pools
router.post('/', isAuthenticated, isAdmin, createPool); // Créer un pool manuellement
router.get('/', isAuthenticated, authorizeTournamentAccess, getPoolsByTourney); // Obtenir tous les pools d'un tournoi
router.get('/:poolId', isAuthenticated, authorizeTournamentAccess, getPoolById); // Obtenir une pool spécifique



module.exports = router;
