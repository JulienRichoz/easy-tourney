// server/routes/auth.js
// Purpose: Define the routes for user authentication

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares'); // Middleware d'authentification
const {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

// Routes d'authentification
// http://localhost:3000/api/auth

router.post('/register', register); // Route pour l'inscription
router.post('/login', login); // Route pour la connexion
router.post('/refresh-token', authenticateToken, refreshToken); // Route pour le rafraîchissement du token
router.post('/forgot-password', forgotPassword); // Route si l'utilisateur a oublié son mot de passe
router.post('/reset-password', resetPassword); // Route pour la réinitialisation du mot de passe

module.exports = router;
