const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  assignPoolToField,
  updatePoolSchedule,
  deletePoolSchedule,
  getPoolSchedulesByTourney,
  getPoolSchedulesByPool,
} = require('../controllers/poolScheduleController');
const { isAuthenticated, isAdmin } = require('../middlewares');

// Base URL: /api/tourneys/:tourneyId/pools/schedule

// Routes pour la gestion des plannings de pools
router.post('/:poolId', isAuthenticated, isAdmin, assignPoolToField); // Assigner une pool à un terrain
router.put('/:poolScheduleId', isAuthenticated, isAdmin, updatePoolSchedule); // Mettre à jour une assignation de pool à un terrain
router.delete('/:poolScheduleId', isAuthenticated, isAdmin, deletePoolSchedule); // Supprimer une assignation de pool à un terrain
router.get('/', isAuthenticated, getPoolSchedulesByTourney); // Récupérer tous les plannings d'un tournoi

// Gestion des plannings d'une pool spécifique
router.get('/:poolId/schedules', isAuthenticated, getPoolSchedulesByPool); // Récupérer les plannings d'une pool spécifique

module.exports = router;

/**
 * TODO: Timer qui ne fonctionne tjr pas quand on passe de prévu à en cours. Il faut reset le timer. Le timer passe direct en mode Pause ? sans quil avance.
 * TODO : Implémenter page websocket SCORE et page statistique (non websocket.. si page vraiment utile?)
 * TODO : IMplémenter page détail du tournoi (très facile et rapide)
 * TODO : Lors des inscriptions, donner la chance à l'utilisateur de pouvoir quitter le tournoi.
 * TODOptionel: Page rejoindre token invitation : rediriger sur page inscription fermées plutot que erreur 403 si les inscriptions sont fermées ou lien non valide
 * TODOptionnel : Ajouter systeme de gestion statuts dans page admin/info (details)
 * REFLECHIR a la vue planning pool <-> game => final
 * IMPLEMENTATION : Partie arbitre des matchs. Websocket ou pas ?
 * IMPLEMENTATION : Vue utilisateur et reflechir au workflow
 * Une fois fini : implémenter PWA ? Heberger app sur serveur ?
 * 
 * AMELIORATIONS
 * Composant entre planning games et planning pools (reduction code, + clean)
 * Utiliser nom des routes pour les requetes axios
 * Refactor composant entre composant custom et composant de base
 * Ajouter test unitaire
 * Ajouter test intégration (deja sur postman)
 */

