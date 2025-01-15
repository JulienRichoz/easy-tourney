//server/routes/exportData.js
// Routes pour exporter les données du tournoi

const express = require('express');
const {
    getFullExportData,
    exportExcel
} = require('../controllers/exportDataController');
const { isAuthenticated, isAdmin } = require('../middlewares');

const router = express.Router({ mergeParams: true }); // mergeParams pour accéder à tourneyId dans les contrôleurs

// Routes pour gérer la configuration d'équipe (team setup)
// http://localhost:3000/api/tourneys/:tourneyId/export-data

router.get('/', isAuthenticated, isAdmin, getFullExportData); // Route pour récupérer toutes les données du tournoi (JSON)
router.get('/excel', isAuthenticated, isAdmin, exportExcel); // Route pour exporter en Excel

module.exports = router;
