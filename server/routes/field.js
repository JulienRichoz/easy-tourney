// server/routes/field.js
const express = require('express');

const { createField, createMultipleFields, getFieldsByTourneyId, getFieldById, updateField, deleteField, deleteAllTourneyFields } = require('../controllers/fieldController');
const { isAuthenticated, isAdmin } = require('../middlewares');

const router = express.Router({ mergeParams: true }); // mergeParams pour accéder à tourneyId dans les contrôleurs

// Routes pour gérer les terrains d'un tournoi
// http://localhost:3000/api/tourneys/:tourneyId/fields

router.post('/', isAuthenticated, isAdmin, createField); // Créer un terrain (admin uniquement)
router.post('/multiple', isAuthenticated, isAdmin, createMultipleFields);
router.get('/', isAuthenticated, getFieldsByTourneyId); // Récupérer tous les terrains d'un tournoi
router.get('/:fieldId', isAuthenticated, getFieldById); // Récupérer un terrain spécifique par son ID
router.put('/:fieldId', isAuthenticated, isAdmin, updateField); // Mettre à jour un terrain (admin uniquement)
router.delete('/:fieldId', isAuthenticated, isAdmin, deleteField); // Supprimer un terrain (admin uniquement)
router.delete('/', isAuthenticated, isAdmin, deleteAllTourneyFields); // Supprimer tous les terrains d'un tournoi

module.exports = router;
