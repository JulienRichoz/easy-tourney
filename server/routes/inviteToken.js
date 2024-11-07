// routes/inviteTokenRoutes.js

const express = require('express');
const router = express.Router();
const { generateInviteToken, getAllInviteTokens, invalidateInviteToken, invalidateTokensForTourney } = require('../controllers/inviteTokenController');
const { isAuthenticated, isAdmin } = require('../middlewares');

router.post('/', isAuthenticated, isAdmin, generateInviteToken); // Route pour générer un token d'invitation pour un tournoi
router.get('/', isAuthenticated, isAdmin, getAllInviteTokens); // Route pour obtenir tous les tokens d'invitation d'un tournoi
router.patch('/:tokenId/invalidate', isAuthenticated, isAdmin, invalidateInviteToken); // invalider un token spécifique
router.put ('/invalidate-all', isAuthenticated, isAdmin, invalidateTokensForTourney); // Invalider tous les tokens d'un tournoi

module.exports = router;
