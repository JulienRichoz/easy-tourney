// server/routes/field.js
const express = require('express');

const { createField, getFieldsByTourneyId, getFieldById, updateField, deleteField, deleteAllTourneyFields } = require('../controllers/fieldController');
const { isAuthenticated, isAdmin } = require('../middlewares');

const router = express.Router({ mergeParams: true }); // mergeParams pour accéder à tourneyId dans les contrôleurs

// Routes pour gérer les terrains d'un tournoi
// http://localhost:3000/api/tourneys/:tourneyId/fields
router.post('/', isAuthenticated, isAdmin, createField); // Créer un terrain (admin uniquement)
router.get('/', isAuthenticated, getFieldsByTourneyId); // Récupérer tous les terrains d'un tournoi
router.get('/:id', isAuthenticated, getFieldById); // Récupérer un terrain spécifique par son ID
router.put('/:id', isAuthenticated, isAdmin, updateField); // Mettre à jour un terrain (admin uniquement)
router.delete('/:id', isAuthenticated, isAdmin, deleteField); // Supprimer un terrain (admin uniquement)
router.delete('/', isAuthenticated, isAdmin, deleteAllTourneyFields); // Supprimer tous les terrains d'un tournoi

module.exports = router;
