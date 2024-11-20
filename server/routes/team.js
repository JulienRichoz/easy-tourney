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
  resetTeamsAndReassignUsers,
  autoFillTeams,
  getUnassignedTeams,
} = require('../controllers/teamController');
const {
  isAuthenticated,
  isAdmin,
  authorizeTournamentAccess,
  authorizeUserOrAdmin,
} = require('../middlewares');

const router = express.Router({ mergeParams: true }); // mergeParams pour accéder à tourneyId

// Routes pour gérer les équipes d'un tournoi
// Base URL: http://localhost:3000/api/tourneys/:tourneyId/teams

// Routes les plus spécifiques en premières
router.post('/generate-teams', isAuthenticated, isAdmin, generateTeams); // Générer des équipes automatiquement pour un tournoi
router.delete('/reset', isAuthenticated, isAdmin, resetTeamsAndReassignUsers); // Réinitialiser les équipes et les utilisateurs

// Routes pour les opérations sur des équipes spécifiques
router.post(
  '/:teamId/users',
  isAuthenticated,
  authorizeTournamentAccess,
  assignUserToTeam
); // Assigner un utilisateur à une équipe
router.delete(
  '/:teamId/users/:userId',
  isAuthenticated,
  authorizeTournamentAccess,
  authorizeUserOrAdmin,
  removeUserFromTeam
); // Supprimer un utilisateur d'une équipe
router.get('/unassigned', isAuthenticated, isAdmin, getUnassignedTeams); // Route pour récupérer les équipes non assignées à une pool
router.get('/:teamId', isAuthenticated, authorizeTournamentAccess, getTeamById); // Récupérer les détails d'une équipe (admin uniquement)
router.put('/:teamId', isAuthenticated, isAdmin, updateTeam); // Mettre à jour une équipe d'un tournoi (admin uniquement)
router.delete('/:teamId', isAuthenticated, isAdmin, deleteTeam); // Supprimer une équipe d'un tournoi (admin uniquement)

// Routes pour les opérations globales sur les équipes
router.post('/', isAuthenticated, isAdmin, createTeam); // Créer une équipe pour un tournoi (admin uniquement)
router.get('/', isAuthenticated, getTeamsByTourney); // Obtenir toutes les équipes d'un tournoi
router.post('/auto-fill', isAuthenticated, isAdmin, autoFillTeams); // Remplir automatiquement les équipes

module.exports = router;
