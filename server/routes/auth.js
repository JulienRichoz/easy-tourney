// server/routes/auth.js
// Purpose: Define the routes for user authentication

const express = require('express');
const { authenticateToken } = require('../middlewares'); // Middleware d'authentification
const authController = require('../controllers/authController');

const router = express.Router();

// Routes d'authentification
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authenticateToken, authController.getProfile);
router.post('/refresh-token', authenticateToken, authController.refreshToken);

module.exports = router;
