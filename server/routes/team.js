// server/routes/team.js
const express = require('express');
const { createTeam, getTeamsByTourney, updateTeam, deleteTeam, deleteAllTeamsByTourney, generateTeams } = require('../controllers/teamController');
const { isAuthenticated, isAdmin } = require('../middlewares');

const router = express.Router({ mergeParams: true }); // mergeParams pour accéder à tourneyId dans les contrôleurs

// Basic CRUD
// http://localhost:3000/api/tourneys/:tourneyId/teams
router.post('/', isAuthenticated, isAdmin, createTeam); // Créer une équipe pour un tournoi (admin uniquement)
router.get('/', isAuthenticated, getTeamsByTourney); // Obtenir toutes les équipes d'un tournoi
router.put('/:id', isAuthenticated, isAdmin, updateTeam); // Mettre à jour une équipe d'un tournoi (admin uniquement)
router.delete('/:id', isAuthenticated, isAdmin, deleteTeam); // Supprimer une équipe d'un tournoi (admin uniquement)
router.delete('/', isAuthenticated, isAdmin, deleteAllTeamsByTourney); // Supprimer toutes les équipes d'un tournoi
router.post('/generate-teams', isAuthenticated, isAdmin, generateTeams); // Générer des équipes pour un tournoi

module.exports = router;
