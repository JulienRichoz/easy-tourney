const express = require('express');
const router = express.Router();
const { getTourneysByUser } = require('../controllers/userController');
const { isAuthenticated } = require('../middlewares');

// Base URL: http://localhost:3000/api/users/:userId

router.get('/:userId/tourneys', isAuthenticated, getTourneysByUser); // Récupérer les tournois pour un utilisateur donné

module.exports = router;
