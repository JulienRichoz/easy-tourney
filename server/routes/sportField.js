// server/routes/sportField.js
// Purpose: Define the routes for sport fields

const express = require('express');
const router = express.Router();
const { createSportField, updateSportField, deleteSportField } = require('../controllers/sportFieldController');
const { isAuthenticated, isAdmin } = require('../middlewares');

// Routes pour gérer les terrains et les sports associés
router.post('/', isAuthenticated, isAdmin, createSportField); // Ajouter un sport à un terrain (admin uniquement)
router.put('/:id', isAuthenticated, isAdmin, updateSportField); // Mettre à jour un sport associé à un terrain (admin uniquement)
router.delete('/:id', isAuthenticated, isAdmin, deleteSportField);

module.exports = router;
