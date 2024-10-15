// server/routes/sportsFields.js
// Purpose: Define the routes for sport fields

const express = require('express');
const router = express.Router();
const { createSportsFields, updateSportsFields, deleteSportsFields } = require('../controllers/sportsFieldsController');
const { isAuthenticated, isAdmin } = require('../middlewares');

// Routes pour gérer les terrains et les sports associés
router.post('/', isAuthenticated, isAdmin, createSportsFields); // Ajouter un sport à un terrain (admin uniquement)
router.put('/:id', isAuthenticated, isAdmin, updateSportsFields); // Mettre à jour un sport associé à un terrain (admin uniquement)
router.delete('/:id', isAuthenticated, isAdmin, deleteSportsFields);

module.exports = router;
