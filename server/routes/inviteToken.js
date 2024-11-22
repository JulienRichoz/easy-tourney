// routes/inviteTokenRoutes.js

const express = require('express');
const {
  generateInviteToken,
  getAllInviteTokens,
  getInviteToken,
  invalidateInviteToken,
  validateInviteToken,
  invalidateAllInviteTokens,
  validateAllInviteTokens,
} = require('../controllers/inviteTokenController');
const { isAuthenticated, isAdmin } = require('../middlewares');
const router = express.Router({ mergeParams: true }); // mergeParams pour accéder à tourneyId dans les contrôleurs

// Routes pour gérer les tokens d'invitation
// http://localhost:3000/api/tourneys/:tourneyId/invite-token
router.post('/', isAuthenticated, isAdmin, generateInviteToken); // Route pour générer un token d'invitation pour un tournoi
router.get('/', isAuthenticated, isAdmin, getAllInviteTokens); // Route pour obtenir tous les tokens d'invitation d'un tournoi
router.get('/:tokenId', isAuthenticated, isAdmin, getInviteToken); // Route pour obtenir tous les tokens d'invitation d'un tournoi

router.patch('/:tokenId/invalidate', isAuthenticated, isAdmin, invalidateInviteToken); // invalider un token spécifique
router.patch('/:tokenId/validate', isAuthenticated, isAdmin, validateInviteToken); // invalider un token spécifique

router.put('/invalidate-all', isAuthenticated, isAdmin, invalidateAllInviteTokens); // Invalider tous les tokens d'un tournoi
router.put('/validate-all', isAuthenticated, isAdmin, validateAllInviteTokens); // Invalider tous les tokens d'un tournoi

module.exports = router;
