// backend/routes/sportField.js
const express = require('express');
const router = express.Router();
const { createSportField } = require('../controllers/sportFieldController');
const { isAuthenticated, isAdmin } = require('../middlewares');

// Routes pour gérer les terrains et les sports associés
router.post('/', isAuthenticated, isAdmin, createSportField); // Ajouter un sport à un terrain (admin uniquement)

module.exports = router;
