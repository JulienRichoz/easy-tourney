// server/routes/sportsFields.js

const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams pour accéder aux paramètres parent

const {
  getSportsByField,
  getSportsFieldsByTourney,
  createSportsFields,
  updateSportsFields,
  deleteSportsFields,
} = require('../controllers/sportsFieldsController');
const {
  isAuthenticated,
  isAdmin,
  verifySportAssignmentStatus,
} = require('../middlewares');

// Routes pour récupérer les sports associés à un tournoi ou un terrain
//localhost:3000/api/tourneys/:tourneyId/sports-fields

router.get('/', isAuthenticated, getSportsFieldsByTourney); // Récupérer tous les sports associés à tous les terrains d'un tournoi
router.get('/fields/:fieldId', isAuthenticated, getSportsByField); // Récupérer les sports associés à un terrain spécifique
router.post('/', isAuthenticated, isAdmin, verifySportAssignmentStatus, createSportsFields); // Associer un sport à un terrain (admin uniquement)
router.put('/:sportsFieldsId', isAuthenticated, isAdmin, verifySportAssignmentStatus, updateSportsFields); // Mettre à jour une association sport/terrain (admin uniquement)
router.delete('/:sportsFieldsId', isAuthenticated, isAdmin, verifySportAssignmentStatus, deleteSportsFields); // Supprimer une association sport/terrain (admin uniquement)

module.exports = router;
