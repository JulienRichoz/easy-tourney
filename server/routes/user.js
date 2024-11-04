// server/routes/user.js
const express = require('express');
const router = express.Router();
const {
    getTourneysByUser, getAllUsers, getUserById, createUser, updateUser, deleteUser, getOwnProfile, getAllUsersWithDetails, removeUserFromTourney,
} = require('../controllers/userController');
const { isAdmin, isAuthenticated, authorizeUserOrAdmin } = require('../middlewares');

// Base URL: http://localhost:3000/api/users/
router.get('/all/details', isAuthenticated, isAdmin, getAllUsersWithDetails); // Récupérer tous les utilisateurs avec leurs détails
router.post('/', isAuthenticated, isAdmin, createUser); // Créer un utilisateur (admin seulement)
router.delete('/:userId/tourneys/:tourneyId', isAuthenticated, isAdmin, removeUserFromTourney); // Supprimer un utilisateur d'un tournoi (admin seulement)
router.get('/:userId/tourneys', isAuthenticated, authorizeUserOrAdmin, getTourneysByUser); // Récupérer les tournois pour un utilisateur donné (soi-même ou admin)
router.get('/', isAuthenticated, isAdmin, getAllUsers); // Récupérer tous les utilisateurs (admin seulement)
router.get('/:userId', isAuthenticated, authorizeUserOrAdmin, getUserById); // Récupérer un utilisateur par ID (soi-même ou admin)
router.put('/:userId', isAuthenticated, authorizeUserOrAdmin, updateUser); // Mettre à jour un utilisateur (soi-même ou admin)
router.delete('/:userId', isAuthenticated, isAdmin, deleteUser); // Supprimer un utilisateur (admin seulement)

module.exports = router;
