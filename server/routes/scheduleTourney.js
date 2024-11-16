// routes/scheduleTourney.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createScheduleTourney,
  getScheduleTourneyByTourney,
  updateScheduleTourney,
} = require('../controllers/scheduleTourneyController');
const { isAuthenticated, isAdmin, authorizeTournamentAccess } = require('../middlewares');

// Base URL: /api/tourneys/:tourneyId/schedule

router.post('/', isAuthenticated, isAdmin, createScheduleTourney); // Créer un planning
router.get('/', isAuthenticated, authorizeTournamentAccess, getScheduleTourneyByTourney); // Récupérer le planning d'un tournoi
router.put('/:scheduleId', isAuthenticated, isAdmin, updateScheduleTourney); // Mettre à jour un planning

module.exports = router;
