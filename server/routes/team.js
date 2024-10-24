// server/routes/team.js
const express = require('express');
const {
    createTeam,
    getTeamsByTourney,
    updateTeam,
    deleteTeam,
    generateTeams,
    getTeamById,
    assignUserToTeam,
    removeUserFromTeam,
    resetTeamsAndReassignUsers
} = require('../controllers/teamController');
const { isAuthenticated, isAdmin } = require('../middlewares');

const router = express.Router({ mergeParams: true }); // mergeParams pour accéder à tourneyId

// Routes pour gérer les équipes d'un tournoi
// Base URL: http://localhost:3000/api/tourneys/:tourneyId/teams

// Routes les plus spécifiques en premières
router.post('/generate-teams', isAuthenticated, isAdmin, generateTeams); // Générer des équipes automatiquement pour un tournoi
router.delete('/reset', isAuthenticated, isAdmin, resetTeamsAndReassignUsers);  // Réinitialiser les équipes et les utilisateurs

// Routes pour les opérations sur des équipes spécifiques
router.post('/:id/users', isAuthenticated, isAdmin, assignUserToTeam); // Assigner un utilisateur à une équipe
router.delete('/:id/users/:userId', isAuthenticated, isAdmin, removeUserFromTeam); // Supprimer un utilisateur d'une équipe
router.get('/:id', isAuthenticated, isAdmin, getTeamById); // Récupérer les détails d'une équipe (admin uniquement)
router.put('/:id', isAuthenticated, isAdmin, updateTeam); // Mettre à jour une équipe d'un tournoi (admin uniquement)
router.delete('/:id', isAuthenticated, isAdmin, deleteTeam); // Supprimer une équipe d'un tournoi (admin uniquement)

// Routes pour les opérations globales sur les équipes
router.post('/', isAuthenticated, isAdmin, createTeam); // Créer une équipe pour un tournoi (admin uniquement)
router.get('/', isAuthenticated, getTeamsByTourney); // Obtenir toutes les équipes d'un tournoi

module.exports = router;
