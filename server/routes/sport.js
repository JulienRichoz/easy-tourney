// server/routes/sport.js
// Purpose: Define the routes for managing sports

const express = require('express');
const router = express.Router();
const { createSport, getSports, updateSport, deleteSport, getSportById, upload } = require('../controllers/sportController');
const { isAuthenticated, isAdmin } = require('../middlewares');

// Routes pour gérer les sports

router.post('/', isAuthenticated, isAdmin, upload, createSport); // Créer un sport (admin uniquement)
router.get('/', getSports); // Récupérer tous les sports
router.get('/:id', getSportById); // Récupérer un sport par son ID
router.put('/:id', isAuthenticated, isAdmin, upload, updateSport); // Mettre à jour un sport (admin uniquement)
router.delete('/:id', isAuthenticated, isAdmin, deleteSport); // Supprimer un sport (admin uniquement)

module.exports = router;
