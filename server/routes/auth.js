// server/routes/auth.js
// Purpose: Define the routes for user authentication

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeUserOrAdmin } = require('../middlewares'); // Middleware d'authentification
const { register, login, refreshToken } = require('../controllers/authController');

// Routes d'authentification
// http://localhost:3000/api/auth

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', authenticateToken, refreshToken);

module.exports = router;
