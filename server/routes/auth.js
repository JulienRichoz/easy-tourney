const express = require('express');
const { authenticateToken } = require('../middlewares/authMiddleware'); // Middleware d'authentification
const authController = require('../controllers/authController');

const router = express.Router();

// Routes d'authentification
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;
