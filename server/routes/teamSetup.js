//server/routes/teamSetup.js

const express = require('express');
const { createTeamSetup, updateTeamSetup, getTeamSetup } = require('../controllers/teamSetupController');
const { isAuthenticated, isAdmin } = require('../middlewares');

const router = express.Router({ mergeParams: true }); // mergeParams pour accéder à tourneyId dans les contrôleurs

// Routes pour gérer la configuration d'équipe (team setup)
// http://localhost:3000/api/tourneys/:tourneyId/team-setup

router.post('/', isAuthenticated, isAdmin, createTeamSetup); // Créer une configuration de team pour un tournoi
router.put('/', isAuthenticated, isAdmin, updateTeamSetup); // Mettre à jour la configuration du team
router.get('/', isAuthenticated, getTeamSetup); // Obtenir la configuration du team pour un tournoi

module.exports = router;
