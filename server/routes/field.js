// server/routes/field.js
// Purpose: Define the routes for managing fields

const express = require('express');
const router = express.Router();
const { createField, getFields, getFieldById, updateField, deleteField, getFieldsByTourneyId, deleteAllTourneyFields } = require('../controllers/fieldController');
const { isAuthenticated, isAdmin } = require('../middlewares');
// Routes pour gérer les terrains

router.post('/', isAuthenticated, isAdmin, createField); // Créer un terrain (admin uniquement) 
router.get('/', isAuthenticated, getFields); // Récupérer tous les terrains
router.get('/:id', isAuthenticated, getFieldById); // Récupérer un terrain par son ID
router.put('/:id', isAuthenticated, isAdmin, updateField); // Mettre à jour un terrain (admin uniquement)
router.delete('/:id', isAuthenticated, isAdmin, deleteField); // Supprimer un terrain (admin uniquement)

router.get('/tourneys/:tourneyId', isAuthenticated, getFieldsByTourneyId); // Récupérer les terrains d'un tournoi
router.delete('/tourneys/:tourneyId/all', isAuthenticated, isAdmin, deleteAllTourneyFields); // Supprimer tous les terrains 

module.exports = router;