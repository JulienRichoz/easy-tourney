const express = require('express');
const router = express.Router();
const { createSport, getSports, updateSport, deleteSport, getSportById } = require('../controllers/sportController');
const { isAuthenticated, isAdmin } = require('../middlewares'); // Import des middlewares

// Routes pour gérer les sports

router.post('/', isAuthenticated, isAdmin, createSport); // Créer un sport (admin uniquement)
router.get('/', getSports); // Récupérer tous les sports
router.get('/:id', getSportById); // Récupérer un sport par son ID
router.put('/:id', isAuthenticated, isAdmin, updateSport); // Mettre à jour un sport (admin uniquement)
router.delete('/:id', isAuthenticated, isAdmin, deleteSport); // Supprimer un sport (admin uniquement)

module.exports = router;
