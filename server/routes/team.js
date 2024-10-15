// server/routes/team.js
const express = require('express');
const { createTeam, getTeamsByTourney, updateTeam, deleteTeam } = require('../controllers/teamController');
const { isAuthenticated, isAdmin } = require('../middlewares');

const router = express.Router();

router.post('/', isAuthenticated, isAdmin, createTeam); // Créer une équipe (admin uniquement)
router.get('/:tourneyId', isAuthenticated, getTeamsByTourney); // Obtenir toutes les équipes d'un tournoi
router.put('/:id', isAuthenticated, isAdmin, updateTeam); // Mettre à jour une équipe (admin uniquement)
router.delete('/:id', isAuthenticated, isAdmin, deleteTeam); // Supprimer une équipe (admin uniquement)

module.exports = router;
